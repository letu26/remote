import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { ProductTraits } from '../services/recommendation-score.js';

const CANDIDATE_LIMIT = 500;

@Injectable()
export class RecommendationRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findCartProductIds(userId: number): Promise<number[]> {
    return this.ids(
      `SELECT DISTINCT v.productId AS id FROM carts c
       JOIN cart_items i ON i.cartId = c.id
       JOIN product_variants v ON v.id = i.variantId
       WHERE c.userId = ?`,
      [userId],
    );
  }

  /** Mọi đơn chưa hủy đều tính là đã mua. */
  async findPurchasedProductIds(userId: number): Promise<number[]> {
    return this.ids(
      `SELECT DISTINCT v.productId AS id FROM orders o
       JOIN order_items i ON i.orderId = o.id
       JOIN product_variants v ON v.id = i.variantId
       WHERE o.userId = ? AND o.status <> 'cancelled'`,
      [userId],
    );
  }

  /** Đặc điểm của sản phẩm đang bán, còn hàng (để gợi ý) và của các sản phẩm người dùng quan tâm. */
  async findTraits(interestIds: number[]): Promise<{ candidates: ProductTraits[]; interests: ProductTraits[] }> {
    const [candidates, interests] = await Promise.all([
      this.traits(
        `p.isActive = 1 AND EXISTS (SELECT 1 FROM product_variants v
           WHERE v.productId = p.id AND v.isActive = 1 AND v.stock > 0)`,
        [],
      ),
      interestIds.length ? this.traits('p.id IN (?)', [interestIds]) : Promise.resolve([]),
    ]);
    return { candidates, interests };
  }

  private async traits(where: string, params: unknown[]): Promise<ProductTraits[]> {
    const rows: (Omit<ProductTraits, 'price' | 'gemstoneIds'> & { price: string })[] = await this.dataSource.query(
      `SELECT p.id, p.price, p.categoryId, c.parentId AS parentCategoryId, p.materialId, p.targetGroup
       FROM products p JOIN categories c ON c.id = p.categoryId
       WHERE ${where}
       ORDER BY p.soldCount DESC, p.id DESC LIMIT ?`,
      [...params, CANDIDATE_LIMIT],
    );
    if (!rows.length) return [];
    const gems: { productId: number; gemstoneId: number }[] = await this.dataSource.query(
      'SELECT productId, gemstoneId FROM product_gemstones WHERE productId IN (?)',
      [rows.map((row) => row.id)],
    );
    return rows.map((row) => ({
      ...row,
      price: Number(row.price),
      gemstoneIds: gems.filter((g) => g.productId === row.id).map((g) => g.gemstoneId),
    }));
  }

  private async ids(sql: string, params: unknown[]): Promise<number[]> {
    const rows: { id: number }[] = await this.dataSource.query(sql, params);
    return rows.map((row) => row.id);
  }
}
