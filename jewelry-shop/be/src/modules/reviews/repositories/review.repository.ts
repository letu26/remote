import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, type EntityManager } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';

/** Một câu UPDATE tính lại điểm trung bình và số đánh giá hiển thị của sản phẩm từ bảng reviews. */
const RECALCULATE_PRODUCT_RATING = `
  UPDATE products SET
    avgRating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE productId = ? AND isHidden = 0), 0),
    reviewCount = (SELECT COUNT(*) FROM reviews WHERE productId = ? AND isHidden = 0)
  WHERE id = ?`;

export interface LockedReview {
  id: number;
  userId: number;
  productId: number;
  isHidden: boolean;
}

/** Thao tác trên một đánh giá đã khóa dòng; mỗi thao tác ghi đều tính lại tổng hợp sản phẩm trong cùng transaction. */
export interface ReviewTransaction {
  review: LockedReview;
  update(fields: { rating?: number; comment?: string | null }): Promise<void>;
  setHidden(isHidden: boolean): Promise<void>;
  remove(): Promise<void>;
}

@Injectable()
export class ReviewRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Tạo đánh giá + tính lại tổng hợp trong một transaction. Duplicate key được ném lên cho service xử lý. */
  create(data: {
    userId: number;
    productId: number;
    orderItemId: number;
    rating: number;
    comment: string | null;
  }): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockProduct(manager, data.productId);
      const result: { insertId: number } = await manager.query(
        'INSERT INTO reviews (userId, productId, orderItemId, rating, comment, isHidden) VALUES (?, ?, ?, ?, ?, 0)',
        [data.userId, data.productId, data.orderItemId, data.rating, data.comment],
      );
      await this.recalculate(manager, data.productId);
      return result.insertId;
    });
  }

  /** Khóa dòng đánh giá (FOR UPDATE) rồi chạy `work`; trả null nếu không có. */
  async withLockedReview<T>(
    where: { id: number; userId?: number },
    work: (tx: ReviewTransaction) => Promise<T>,
  ): Promise<T | null> {
    // productId không bao giờ đổi: đọc ngoài transaction để luôn khóa SẢN PHẨM trước, rồi mới khóa đánh giá
    // (cùng thứ tự với create) -> không deadlock, và transaction chưa có lần đọc nhất quán nào khi chờ khóa.
    const owner: { productId: number }[] = await this.dataSource.query(
      `SELECT productId FROM reviews WHERE id = ?${where.userId === undefined ? '' : ' AND userId = ?'}`,
      where.userId === undefined ? [where.id] : [where.id, where.userId],
    );
    if (!owner.length) return null;
    return this.dataSource.transaction(async (manager) => {
      await this.lockProduct(manager, owner[0].productId);
      const rows: (Omit<LockedReview, 'isHidden'> & { isHidden: number })[] = await manager.query(
        `SELECT id, userId, productId, isHidden FROM reviews WHERE id = ?${where.userId === undefined ? '' : ' AND userId = ?'} FOR UPDATE`,
        where.userId === undefined ? [where.id] : [where.id, where.userId],
      );
      if (!rows.length) return null;
      const review: LockedReview = { ...rows[0], isHidden: toBool(rows[0].isHidden) };
      return work({
        review,
        update: async (fields) => {
          const sets: string[] = [];
          const params: unknown[] = [];
          if (fields.rating !== undefined) {
            sets.push('rating = ?');
            params.push(fields.rating);
          }
          if (fields.comment !== undefined) {
            sets.push('comment = ?');
            params.push(fields.comment);
          }
          if (!sets.length) return;
          await manager.query(`UPDATE reviews SET ${sets.join(', ')} WHERE id = ?`, [...params, review.id]);
          await this.recalculate(manager, review.productId);
        },
        setHidden: async (isHidden) => {
          await manager.query('UPDATE reviews SET isHidden = ? WHERE id = ?', [isHidden ? 1 : 0, review.id]);
          await this.recalculate(manager, review.productId);
        },
        remove: async () => {
          await manager.query('DELETE FROM reviews WHERE id = ?', [review.id]);
          await this.recalculate(manager, review.productId);
        },
      });
    });
  }

  /**
   * Khóa dòng sản phẩm TRƯỚC khi có lần đọc nhất quán nào trong transaction, để các thao tác đồng thời trên cùng
   * sản phẩm chạy tuần tự và câu UPDATE tổng hợp luôn thấy đủ dữ liệu đã commit của các transaction trước.
   */
  private async lockProduct(manager: EntityManager, productId: number): Promise<void> {
    await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
  }

  private async recalculate(manager: EntityManager, productId: number): Promise<void> {
    await manager.query(RECALCULATE_PRODUCT_RATING, [productId, productId, productId]);
  }
}
