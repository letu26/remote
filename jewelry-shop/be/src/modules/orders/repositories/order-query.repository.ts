import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '../models/order.enums.js';

export interface OrderRow {
  id: number;
  code: string;
  userId: number;
  createdAt: Date;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: Date | null;
  cancelReason: string | null;
  note: string | null;
  receiverName: string;
  receiverPhone: string;
  provinceName: string;
  wardName: string;
  addressDetail: string;
  shippingMethodName: string;
  subtotal: number;
  shippingFee: number;
  total: number;
}

export interface OrderItemRow {
  productName: string;
  productCode: string;
  productSlug: string | null;
  size: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderHistoryRow {
  status: OrderStatus;
  note: string | null;
  createdAt: Date;
  changedByName: string | null;
}

export interface OrderSummaryRow {
  id: number;
  code: string;
  createdAt: Date;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  receiverName: string;
  receiverPhone: string;
}

export interface OrderPreviewItem {
  productName: string;
  size: string;
  imageUrl: string | null;
  quantity: number;
}

export interface AdminOrderFilter {
  q?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: number;
  from?: Date;
  /** Cận trên loại trừ. */
  toExclusive?: Date;
}

type RawOrder = Omit<OrderRow, 'subtotal' | 'shippingFee' | 'total'> & {
  subtotal: string;
  shippingFee: string;
  total: string;
};

const ORDER_COLUMNS = `o.id, o.code, o.userId, o.createdAt, o.status, o.paymentMethod, o.paymentStatus, o.paidAt,
  o.cancelReason, o.note, o.receiverName, o.receiverPhone, o.provinceName, o.wardName, o.addressDetail,
  o.shippingMethodName, o.subtotal, o.shippingFee, o.total`;

const toOrder = (row: RawOrder): OrderRow => ({
  ...row,
  subtotal: Number(row.subtotal),
  shippingFee: Number(row.shippingFee),
  total: Number(row.total),
});

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

/** Truy vấn đọc đơn hàng; danh sách lấy mục sản phẩm bằng một truy vấn gộp theo orderId. */
@Injectable()
export class OrderQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findByCode(userId: number, code: string): Promise<OrderRow | null> {
    const rows: RawOrder[] = await this.dataSource.query(
      `SELECT ${ORDER_COLUMNS} FROM orders o WHERE o.code = ? AND o.userId = ?`,
      [code, userId],
    );
    return rows[0] ? toOrder(rows[0]) : null;
  }

  async findById(id: number): Promise<OrderRow | null> {
    const rows: RawOrder[] = await this.dataSource.query(`SELECT ${ORDER_COLUMNS} FROM orders o WHERE o.id = ?`, [id]);
    return rows[0] ? toOrder(rows[0]) : null;
  }

  async findItems(orderId: number): Promise<OrderItemRow[]> {
    const rows: (Omit<OrderItemRow, 'unitPrice' | 'lineTotal'> & { unitPrice: string; lineTotal: string })[] =
      await this.dataSource.query(
        `SELECT oi.productName, oi.productCode, p.slug AS productSlug, oi.size, oi.imageUrl, oi.unitPrice,
                oi.quantity, oi.lineTotal
         FROM order_items oi
         LEFT JOIN product_variants v ON v.id = oi.variantId
         LEFT JOIN products p ON p.id = v.productId
         WHERE oi.orderId = ? ORDER BY oi.id ASC`,
        [orderId],
      );
    return rows.map((row) => ({ ...row, unitPrice: Number(row.unitPrice), lineTotal: Number(row.lineTotal) }));
  }

  findHistory(orderId: number): Promise<OrderHistoryRow[]> {
    return this.dataSource.query(
      `SELECT h.status, h.note, h.createdAt, u.fullName AS changedByName
       FROM order_status_history h LEFT JOIN users u ON u.id = h.changedById
       WHERE h.orderId = ? ORDER BY h.createdAt ASC, h.id ASC`,
      [orderId],
    );
  }

  async findCustomer(userId: number): Promise<{ id: number; fullName: string; phone: string; email: string } | null> {
    const rows: { id: number; fullName: string; phone: string; email: string }[] = await this.dataSource.query(
      'SELECT id, fullName, phone, email FROM users WHERE id = ?',
      [userId],
    );
    return rows[0] ?? null;
  }

  async findCustomerPage(
    userId: number,
    status: OrderStatus | undefined,
    limit: number,
    offset: number,
  ): Promise<{ rows: OrderSummaryRow[]; total: number }> {
    const where = status ? 'o.userId = ? AND o.status = ?' : 'o.userId = ?';
    const params = status ? [userId, status] : [userId];
    return this.findPage(where, params, limit, offset);
  }

  async findAdminPage(filter: AdminOrderFilter, limit: number, offset: number): Promise<{ rows: OrderSummaryRow[]; total: number }> {
    const conditions = ['1 = 1'];
    const params: unknown[] = [];
    if (filter.q) {
      const pattern = `%${escapeLike(filter.q)}%`;
      conditions.push('(o.code LIKE ? OR o.receiverName LIKE ? OR o.receiverPhone LIKE ?)');
      params.push(pattern, pattern, pattern);
    }
    if (filter.status) {
      conditions.push('o.status = ?');
      params.push(filter.status);
    }
    if (filter.paymentStatus) {
      conditions.push('o.paymentStatus = ?');
      params.push(filter.paymentStatus);
    }
    if (filter.userId !== undefined) {
      conditions.push('o.userId = ?');
      params.push(filter.userId);
    }
    if (filter.from) {
      conditions.push('o.createdAt >= ?');
      params.push(filter.from);
    }
    if (filter.toExclusive) {
      conditions.push('o.createdAt < ?');
      params.push(filter.toExclusive);
    }
    return this.findPage(conditions.join(' AND '), params, limit, offset);
  }

  /** Mục sản phẩm của nhiều đơn trong một truy vấn: orderId -> { itemCount, items (tối đa `limit`) }. */
  async findItemPreviews(orderIds: number[], limit: number): Promise<Map<number, { itemCount: number; items: OrderPreviewItem[] }>> {
    const result = new Map<number, { itemCount: number; items: OrderPreviewItem[] }>();
    if (!orderIds.length) return result;
    const rows: (OrderPreviewItem & { orderId: number })[] = await this.dataSource.query(
      'SELECT orderId, productName, size, imageUrl, quantity FROM order_items WHERE orderId IN (?) ORDER BY orderId, id',
      [orderIds],
    );
    for (const { orderId, ...item } of rows) {
      const entry = result.get(orderId) ?? { itemCount: 0, items: [] };
      entry.itemCount += 1;
      if (entry.items.length < limit) entry.items.push(item);
      result.set(orderId, entry);
    }
    return result;
  }

  private async findPage(
    where: string,
    params: unknown[],
    limit: number,
    offset: number,
  ): Promise<{ rows: OrderSummaryRow[]; total: number }> {
    const [countRows, rows]: [{ total: string }[], (Omit<OrderSummaryRow, 'total'> & { total: string })[]] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS total FROM orders o WHERE ${where}`, params),
      this.dataSource.query(
        `SELECT o.id, o.code, o.createdAt, o.status, o.paymentMethod, o.paymentStatus, o.total,
                o.receiverName, o.receiverPhone
         FROM orders o WHERE ${where}
         ORDER BY o.createdAt DESC, o.id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
    ]);
    return {
      total: Number(countRows[0]?.total ?? 0),
      rows: rows.map((row) => ({ ...row, total: Number(row.total) })),
    };
  }
}
