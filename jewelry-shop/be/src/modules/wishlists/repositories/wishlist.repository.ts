import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getDuplicateInfo } from '../../../utils/db-error.util.js';

export interface WishlistEntry {
  productId: number;
  addedAt: Date;
}

@Injectable()
export class WishlistRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Danh mục của sản phẩm đang bán; null nếu không có hoặc đã ẩn. */
  async findActiveProductCategoryId(productId: number): Promise<number | null> {
    const rows: { categoryId: number }[] = await this.dataSource.query(
      'SELECT categoryId FROM products WHERE id = ? AND isActive = 1 LIMIT 1',
      [productId],
    );
    return rows[0]?.categoryId ?? null;
  }

  /** Thêm vào yêu thích; trả true nếu vừa tạo, false nếu đã có (trùng khóa unique userId+productId). */
  async add(userId: number, productId: number): Promise<boolean> {
    try {
      await this.dataSource.query('INSERT INTO wishlists (userId, productId) VALUES (?, ?)', [userId, productId]);
      return true;
    } catch (error) {
      if (getDuplicateInfo(error)) return false;
      throw error;
    }
  }

  async remove(userId: number, productId: number): Promise<void> {
    await this.dataSource.query('DELETE FROM wishlists WHERE userId = ? AND productId = ?', [userId, productId]);
  }

  async findAllProductIds(userId: number): Promise<number[]> {
    const rows: { productId: number }[] = await this.dataSource.query(
      'SELECT productId FROM wishlists WHERE userId = ? ORDER BY createdAt DESC, id DESC',
      [userId],
    );
    return rows.map((row) => row.productId);
  }

  /** Một trang yêu thích của sản phẩm đang bán thuộc các danh mục cho phép, mới thêm lên đầu. */
  async findPage(
    userId: number,
    categoryIds: number[],
    limit: number,
    offset: number,
  ): Promise<{ entries: WishlistEntry[]; total: number }> {
    const from = `FROM wishlists w JOIN products p ON p.id = w.productId AND p.isActive = 1
                  WHERE w.userId = ? AND p.categoryId IN (?)`;
    const [countRows, entries]: [{ total: string }[], WishlistEntry[]] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total ${from}`, [userId, categoryIds]),
      this.dataSource.query(
        `SELECT w.productId, w.createdAt AS addedAt ${from} ORDER BY w.createdAt DESC, w.id DESC LIMIT ? OFFSET ?`,
        [userId, categoryIds, limit, offset],
      ),
    ]);
    return { entries, total: Number(countRows[0]?.total ?? 0) };
  }
}
