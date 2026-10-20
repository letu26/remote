import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, type EntityManager } from 'typeorm';
import { getDuplicateInfo } from '../../../utils/db-error.util.js';
import { generateOrderCode } from '../../../utils/order-code.util.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../models/order.enums.js';

export interface NewOrderLine {
  cartItemId: number;
  variantId: number;
  productName: string;
  productCode: string;
  size: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface NewOrderInput {
  userId: number;
  receiverName: string;
  receiverPhone: string;
  provinceName: string;
  wardName: string;
  addressDetail: string;
  note: string | null;
  shippingMethodId: number;
  shippingMethodName: string;
  shippingFee: number;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  lines: NewOrderLine[];
}

export interface StockShortage {
  variantId: number;
  productName: string;
  size: string;
  available: number;
  requested: number;
}

/** Ném ra (và rollback transaction) khi có biến thể không đủ tồn kho. */
export class StockShortageError extends Error {
  constructor(readonly shortages: StockShortage[]) {
    super('Insufficient stock');
  }
}

/** Dòng giỏ đã đổi/đã bị xóa giữa lúc tính giá và lúc đặt. */
export class CartChangedError extends Error {
  constructor() {
    super('Cart changed');
  }
}

export interface LockedOrder {
  id: number;
  code: string;
  userId: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}

export interface OrderUpdate {
  status?: OrderStatus;
  cancelReason?: string | null;
  paymentStatus?: PaymentStatus;
  paidAt?: Date | null;
}

/** Thao tác trên một đơn đã bị khóa dòng (SELECT ... FOR UPDATE); service quyết định nghiệp vụ. */
export interface OrderTransaction {
  order: LockedOrder;
  update(fields: OrderUpdate): Promise<void>;
  addHistory(status: OrderStatus, changedById: number | null, note: string | null): Promise<void>;
  /** Hoàn tồn kho các mục của đơn (gọi đúng một lần khi hủy). */
  restockItems(): Promise<void>;
  /** Cộng soldCount theo số lượng đã bán của đơn. */
  increaseSoldCount(): Promise<void>;
}

const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class OrderRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Một transaction nguyên tử: khóa dòng giỏ, trừ tồn kho (UPDATE có điều kiện, theo variantId tăng dần để
   * tránh deadlock), tạo đơn + mục + lịch sử, xóa dòng giỏ đã đặt.
   */
  createOrder(input: NewOrderInput): Promise<{ id: number; code: string }> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockAndVerifyCartLines(manager, input);

      const shortages: StockShortage[] = [];
      const ordered = [...input.lines].sort((a, b) => a.variantId - b.variantId);
      for (const line of ordered) {
        const result: { affectedRows: number } = await manager.query(
          'UPDATE product_variants SET stock = stock - ?, version = version + 1 WHERE id = ? AND isActive = 1 AND stock >= ?',
          [line.quantity, line.variantId, line.quantity],
        );
        if (result.affectedRows === 0) {
          const rows: { stock: number }[] = await manager.query('SELECT stock FROM product_variants WHERE id = ?', [line.variantId]);
          shortages.push({
            variantId: line.variantId,
            productName: line.productName,
            size: line.size,
            available: rows[0]?.stock ?? 0,
            requested: line.quantity,
          });
        }
      }
      if (shortages.length) throw new StockShortageError(shortages);

      const { id, code } = await this.insertOrder(manager, input);
      await manager.query(
        `INSERT INTO order_items (orderId, variantId, productName, productCode, imageUrl, size, unitPrice, quantity, lineTotal)
         VALUES ?`,
        [
          input.lines.map((line) => [
            id,
            line.variantId,
            line.productName,
            line.productCode,
            line.imageUrl,
            line.size,
            line.unitPrice,
            line.quantity,
            line.lineTotal,
          ]),
        ],
      );
      await manager.query('INSERT INTO order_status_history (orderId, status, changedById, note) VALUES (?, ?, ?, ?)', [
        id,
        OrderStatus.PENDING,
        input.userId,
        'Đặt hàng',
      ]);
      await manager.query('DELETE FROM cart_items WHERE id IN (?)', [input.lines.map((line) => line.cartItemId)]);
      return { id, code };
    });
  }

  /** Khóa dòng đơn rồi chạy `work`; trả null nếu không tìm thấy đơn. */
  withLockedOrder<T>(
    where: { id: number } | { code: string; userId: number },
    work: (tx: OrderTransaction) => Promise<T>,
  ): Promise<T | null> {
    return this.dataSource.transaction(async (manager) => {
      const [clause, params] =
        'id' in where ? ['id = ?', [where.id]] : ['code = ? AND userId = ?', [where.code, where.userId]];
      const rows: LockedOrder[] = await manager.query(
        `SELECT id, code, userId, status, paymentMethod, paymentStatus FROM orders WHERE ${clause} FOR UPDATE`,
        params,
      );
      if (!rows.length) return null;
      return work(this.createTransaction(manager, rows[0]));
    });
  }

  private async lockAndVerifyCartLines(manager: EntityManager, input: NewOrderInput): Promise<void> {
    const rows: { id: number; quantity: number }[] = await manager.query(
      `SELECT ci.id, ci.quantity FROM cart_items ci JOIN carts c ON c.id = ci.cartId
       WHERE c.userId = ? AND ci.id IN (?) FOR UPDATE`,
      [input.userId, input.lines.map((line) => line.cartItemId)],
    );
    const quantityById = new Map(rows.map((row) => [row.id, row.quantity]));
    if (input.lines.some((line) => quantityById.get(line.cartItemId) !== line.quantity)) throw new CartChangedError();
  }

  private async insertOrder(manager: EntityManager, input: NewOrderInput): Promise<{ id: number; code: string }> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = generateOrderCode();
      try {
        const result: { insertId: number } = await manager.query(
          `INSERT INTO orders (code, userId, receiverName, receiverPhone, provinceName, wardName, addressDetail, note,
                               shippingMethodId, shippingMethodName, subtotal, shippingFee, total, paymentMethod,
                               paymentStatus, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending')`,
          [
            code,
            input.userId,
            input.receiverName,
            input.receiverPhone,
            input.provinceName,
            input.wardName,
            input.addressDetail,
            input.note,
            input.shippingMethodId,
            input.shippingMethodName,
            input.subtotal,
            input.shippingFee,
            input.total,
            input.paymentMethod,
          ],
        );
        return { id: result.insertId, code };
      } catch (error) {
        // Trùng mã đơn (duplicate key): sinh mã khác và thử lại.
        if (getDuplicateInfo(error)?.table !== 'orders' || attempt === MAX_CODE_ATTEMPTS - 1) throw error;
      }
    }
    throw new Error('Không sinh được mã đơn');
  }

  private createTransaction(manager: EntityManager, order: LockedOrder): OrderTransaction {
    return {
      order,
      update: async (fields) => {
        const sets: string[] = [];
        const params: unknown[] = [];
        if (fields.status !== undefined) {
          sets.push('status = ?');
          params.push(fields.status);
        }
        if (fields.cancelReason !== undefined) {
          sets.push('cancelReason = ?');
          params.push(fields.cancelReason);
        }
        if (fields.paymentStatus !== undefined) {
          sets.push('paymentStatus = ?');
          params.push(fields.paymentStatus);
        }
        if (fields.paidAt !== undefined) {
          sets.push('paidAt = ?');
          params.push(fields.paidAt);
        }
        if (!sets.length) return;
        await manager.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, [...params, order.id]);
      },
      addHistory: async (status, changedById, note) => {
        await manager.query('INSERT INTO order_status_history (orderId, status, changedById, note) VALUES (?, ?, ?, ?)', [
          order.id,
          status,
          changedById,
          note,
        ]);
      },
      restockItems: async () => {
        await manager.query(
          `UPDATE product_variants v
           JOIN (SELECT variantId, SUM(quantity) AS qty FROM order_items WHERE orderId = ? GROUP BY variantId) t
             ON t.variantId = v.id
           SET v.stock = v.stock + t.qty, v.version = v.version + 1`,
          [order.id],
        );
      },
      increaseSoldCount: async () => {
        await manager.query(
          `UPDATE products p
           JOIN (SELECT v.productId, SUM(oi.quantity) AS qty
                 FROM order_items oi JOIN product_variants v ON v.id = oi.variantId
                 WHERE oi.orderId = ? GROUP BY v.productId) t ON t.productId = p.id
           SET p.soldCount = p.soldCount + t.qty`,
          [order.id],
        );
      },
    };
  }
}
