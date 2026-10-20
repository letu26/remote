import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, type EntityManager } from 'typeorm';
import { toBool } from '../../../utils/db-error.util.js';
import { ACTIVE_PROMOTION_JOIN, ProductQueryRepository } from '../../catalog/repositories/product-query.repository.js';

export interface CartLineRow {
  id: number;
  variantId: number;
  quantity: number;
  size: string;
  stock: number;
  variantActive: boolean;
  productId: number;
  productCode: string;
  productName: string;
  productSlug: string;
  price: number;
  productActive: boolean;
  categoryId: number;
  discountPercent: number | null;
  imageUrl: string | null;
}

export interface VariantState {
  categoryId: number;
  stock: number;
  variantActive: boolean;
  productActive: boolean;
}

export interface CartItemRef {
  id: number;
  variantId: number;
  quantity: number;
}

/** Thao tác trong transaction khi đã khóa giỏ của người dùng; service quyết định nghiệp vụ. */
export interface CartTransaction {
  findVariantState(variantId: number): Promise<VariantState | null>;
  findItemByVariant(variantId: number): Promise<CartItemRef | null>;
  findItemById(itemId: number): Promise<CartItemRef | null>;
  /** INSERT ... ON DUPLICATE KEY UPDATE: tạo dòng mới hoặc cộng dồn số lượng, chặn ở ngưỡng maxQuantity. */
  addQuantity(variantId: number, quantity: number, maxQuantity: number): Promise<void>;
  setQuantity(itemId: number, quantity: number): Promise<void>;
}

interface RawLine {
  id: number;
  variantId: number;
  quantity: number;
  size: string;
  stock: number;
  variantActive: number;
  productId: number;
  productCode: string;
  productName: string;
  productSlug: string;
  price: string;
  productActive: number;
  categoryId: number;
  discountPercent: number | null;
}

@Injectable()
export class CartRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly productQueries: ProductQueryRepository,
  ) {}

  /** Mọi dòng giỏ cùng thông tin sản phẩm/tồn kho/khuyến mại trong một truy vấn, ảnh đại diện lấy gộp. Không ghi DB. */
  async findLines(userId: number, now: Date): Promise<CartLineRow[]> {
    const rows: RawLine[] = await this.dataSource.query(
      `SELECT ci.id, ci.variantId, ci.quantity, v.size, v.stock, v.isActive AS variantActive,
              p.id AS productId, p.code AS productCode, p.name AS productName, p.slug AS productSlug,
              p.price, p.isActive AS productActive, p.categoryId, pr.discountPercent
       FROM carts c
       JOIN cart_items ci ON ci.cartId = c.id
       JOIN product_variants v ON v.id = ci.variantId
       JOIN products p ON p.id = v.productId
       ${ACTIVE_PROMOTION_JOIN}
       WHERE c.userId = ?
       ORDER BY ci.createdAt DESC, ci.id DESC`,
      [now, now, userId],
    );
    const images = await this.productQueries.findPrimaryImageUrls([...new Set(rows.map((row) => row.productId))]);
    return rows.map((row) => ({
      ...row,
      price: Number(row.price),
      variantActive: toBool(row.variantActive),
      productActive: toBool(row.productActive),
      imageUrl: images.get(row.productId) ?? null,
    }));
  }

  async summary(userId: number): Promise<{ itemCount: number; totalQuantity: number }> {
    const rows: { itemCount: string; totalQuantity: string | null }[] = await this.dataSource.query(
      `SELECT COUNT(ci.id) AS itemCount, SUM(ci.quantity) AS totalQuantity
       FROM carts c JOIN cart_items ci ON ci.cartId = c.id WHERE c.userId = ?`,
      [userId],
    );
    return { itemCount: Number(rows[0]?.itemCount ?? 0), totalQuantity: Number(rows[0]?.totalQuantity ?? 0) };
  }

  /**
   * Tạo giỏ nếu chưa có (một câu lệnh nguyên tử dựa vào unique userId, hai request đầu tiên đến cùng lúc
   * không lỗi/không trùng) rồi khóa dòng giỏ để các thao tác ghi của cùng người dùng chạy tuần tự.
   */
  runInCart<T>(userId: number, work: (tx: CartTransaction) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const result: { insertId: number } = await manager.query(
        'INSERT INTO carts (userId) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
        [userId],
      );
      const cartId = result.insertId;
      await manager.query('SELECT id FROM carts WHERE id = ? FOR UPDATE', [cartId]);
      return work(this.createTransaction(manager, cartId));
    });
  }

  async removeItems(userId: number, itemIds: number[]): Promise<number> {
    if (!itemIds.length) return 0;
    const result: { affectedRows: number } = await this.dataSource.query(
      `DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cartId WHERE c.userId = ? AND ci.id IN (?)`,
      [userId, itemIds],
    );
    return result.affectedRows;
  }

  async clear(userId: number): Promise<void> {
    await this.dataSource.query(
      'DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cartId WHERE c.userId = ?',
      [userId],
    );
  }

  private createTransaction(manager: EntityManager, cartId: number): CartTransaction {
    return {
      findVariantState: async (variantId) => {
        const rows: { stock: number; variantActive: number; productActive: number; categoryId: number }[] = await manager.query(
          `SELECT v.stock, v.isActive AS variantActive, p.isActive AS productActive, p.categoryId
           FROM product_variants v JOIN products p ON p.id = v.productId WHERE v.id = ?`,
          [variantId],
        );
        return rows[0]
          ? { categoryId: rows[0].categoryId, stock: rows[0].stock, variantActive: toBool(rows[0].variantActive), productActive: toBool(rows[0].productActive) }
          : null;
      },
      findItemByVariant: async (variantId) => {
        const rows: CartItemRef[] = await manager.query(
          'SELECT id, variantId, quantity FROM cart_items WHERE cartId = ? AND variantId = ?',
          [cartId, variantId],
        );
        return rows[0] ?? null;
      },
      findItemById: async (itemId) => {
        const rows: CartItemRef[] = await manager.query(
          'SELECT id, variantId, quantity FROM cart_items WHERE cartId = ? AND id = ?',
          [cartId, itemId],
        );
        return rows[0] ?? null;
      },
      addQuantity: async (variantId, quantity, maxQuantity) => {
        await manager.query(
          `INSERT INTO cart_items (cartId, variantId, quantity) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE quantity = IF(quantity + VALUES(quantity) <= ?, quantity + VALUES(quantity), quantity)`,
          [cartId, variantId, quantity, maxQuantity],
        );
      },
      setQuantity: async (itemId, quantity) => {
        await manager.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND cartId = ?', [quantity, itemId, cartId]);
      },
    };
  }
}
