import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';

export interface ReviewRow {
  id: number;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicReviewRow {
  id: number;
  userId: number;
  fullName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MyReviewRow extends ReviewRow {
  productId: number;
  productName: string;
  productSlug: string;
}

export interface AdminReviewRow extends ReviewRow {
  productId: number;
  productName: string;
  productCode: string;
  productSlug: string;
  userId: number;
  reviewerName: string;
  reviewerPhone: string;
}

export interface AdminReviewFilter {
  q?: string;
  rating?: number;
  hidden?: boolean;
  productId?: number;
}

type WithHidden<T> = Omit<T, 'isHidden'> & { isHidden: number };

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

const ADMIN_SELECT = `
  SELECT r.id, r.productId, p.name AS productName, p.code AS productCode, p.slug AS productSlug, r.userId,
         u.fullName AS reviewerName, u.phone AS reviewerPhone, r.rating, r.comment, r.isHidden,
         r.createdAt, r.updatedAt
  FROM reviews r
  JOIN products p ON p.id = r.productId
  JOIN users u ON u.id = r.userId`;

/** Truy vấn đọc đánh giá; mọi danh sách lấy tên người dùng/sản phẩm bằng JOIN, không N+1. */
@Injectable()
export class ReviewQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findActiveProductBySlug(slug: string): Promise<{ id: number; categoryId: number } | null> {
    const rows: { id: number; categoryId: number }[] = await this.dataSource.query(
      'SELECT id, categoryId FROM products WHERE slug = ? AND isActive = 1 LIMIT 1',
      [slug],
    );
    return rows[0] ?? null;
  }

  /** Phân bố số sao của các đánh giá hiển thị: một truy vấn GROUP BY rating. */
  async countByRating(productId: number): Promise<Map<number, number>> {
    const rows: { rating: number; n: string }[] = await this.dataSource.query(
      'SELECT rating, COUNT(*) AS n FROM reviews WHERE productId = ? AND isHidden = 0 GROUP BY rating',
      [productId],
    );
    return new Map(rows.map((row) => [row.rating, Number(row.n)]));
  }

  async findVisiblePage(
    productId: number,
    rating: number | undefined,
    limit: number,
    offset: number,
  ): Promise<{ rows: PublicReviewRow[]; total: number }> {
    const where = rating === undefined ? 'r.productId = ? AND r.isHidden = 0' : 'r.productId = ? AND r.isHidden = 0 AND r.rating = ?';
    const params = rating === undefined ? [productId] : [productId, rating];
    const [countRows, rows]: [{ total: string }[], PublicReviewRow[]] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM reviews r WHERE ${where}`, params),
      this.dataSource.query(
        `SELECT r.id, r.userId, u.fullName, r.rating, r.comment, r.createdAt, r.updatedAt
         FROM reviews r JOIN users u ON u.id = r.userId
         WHERE ${where}
         ORDER BY r.createdAt DESC, r.id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
    ]);
    return { rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findByUserAndProduct(userId: number, productId: number): Promise<ReviewRow | null> {
    const rows: WithHidden<ReviewRow>[] = await this.dataSource.query(
      'SELECT id, rating, comment, isHidden, createdAt, updatedAt FROM reviews WHERE userId = ? AND productId = ?',
      [userId, productId],
    );
    return rows[0] ? { ...rows[0], isHidden: toBool(rows[0].isHidden) } : null;
  }

  async findById(id: number): Promise<ReviewRow | null> {
    const rows: WithHidden<ReviewRow>[] = await this.dataSource.query(
      'SELECT id, rating, comment, isHidden, createdAt, updatedAt FROM reviews WHERE id = ?',
      [id],
    );
    return rows[0] ? { ...rows[0], isHidden: toBool(rows[0].isHidden) } : null;
  }

  /** Dòng đơn của đơn đã giao gần nhất chứa sản phẩm (mọi biến thể) của người dùng. */
  async findLatestDeliveredOrderItemId(userId: number, productId: number): Promise<number | null> {
    const rows: { id: number }[] = await this.dataSource.query(
      `SELECT oi.id
       FROM order_items oi
       JOIN orders o ON o.id = oi.orderId
       JOIN product_variants v ON v.id = oi.variantId
       WHERE o.userId = ? AND o.status = 'delivered' AND v.productId = ?
       ORDER BY o.createdAt DESC, oi.id DESC LIMIT 1`,
      [userId, productId],
    );
    return rows[0]?.id ?? null;
  }

  async findMinePage(userId: number, limit: number, offset: number): Promise<{ rows: MyReviewRow[]; total: number }> {
    const [countRows, rows]: [{ total: string }[], WithHidden<MyReviewRow>[]] = await Promise.all([
      this.dataSource.query('SELECT COUNT(*) AS total FROM reviews WHERE userId = ?', [userId]),
      this.dataSource.query(
        `SELECT r.id, r.productId, p.name AS productName, p.slug AS productSlug, r.rating, r.comment, r.isHidden,
                r.createdAt, r.updatedAt
         FROM reviews r JOIN products p ON p.id = r.productId
         WHERE r.userId = ? ORDER BY r.createdAt DESC, r.id DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset],
      ),
    ]);
    return {
      total: Number(countRows[0]?.total ?? 0),
      rows: rows.map((row) => ({ ...row, isHidden: toBool(row.isHidden) })),
    };
  }

  async findAdminPage(filter: AdminReviewFilter, limit: number, offset: number): Promise<{ rows: AdminReviewRow[]; total: number }> {
    const conditions = ['1 = 1'];
    const params: unknown[] = [];
    if (filter.q) {
      const pattern = `%${escapeLike(filter.q)}%`;
      conditions.push('(r.comment LIKE ? OR p.name LIKE ? OR p.code LIKE ? OR u.fullName LIKE ? OR u.phone LIKE ?)');
      params.push(pattern, pattern, pattern, pattern, pattern);
    }
    if (filter.rating !== undefined) {
      conditions.push('r.rating = ?');
      params.push(filter.rating);
    }
    if (filter.hidden !== undefined) {
      conditions.push('r.isHidden = ?');
      params.push(filter.hidden ? 1 : 0);
    }
    if (filter.productId !== undefined) {
      conditions.push('r.productId = ?');
      params.push(filter.productId);
    }
    const where = conditions.join(' AND ');
    const [countRows, rows]: [{ total: string }[], WithHidden<AdminReviewRow>[]] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*) AS total FROM reviews r JOIN products p ON p.id = r.productId JOIN users u ON u.id = r.userId WHERE ${where}`,
        params,
      ),
      this.dataSource.query(`${ADMIN_SELECT} WHERE ${where} ORDER BY r.createdAt DESC, r.id DESC LIMIT ? OFFSET ?`, [
        ...params,
        limit,
        offset,
      ]),
    ]);
    return {
      total: Number(countRows[0]?.total ?? 0),
      rows: rows.map((row) => ({ ...row, isHidden: toBool(row.isHidden) })),
    };
  }

  async findAdminById(id: number): Promise<AdminReviewRow | null> {
    const rows: WithHidden<AdminReviewRow>[] = await this.dataSource.query(`${ADMIN_SELECT} WHERE r.id = ?`, [id]);
    return rows[0] ? { ...rows[0], isHidden: toBool(rows[0].isHidden) } : null;
  }
}
