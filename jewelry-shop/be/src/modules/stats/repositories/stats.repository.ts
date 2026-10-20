import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { Granularity } from '../../../utils/vietnam-time.util.js';

export interface DeliveredAggregate {
  orders: number;
  revenue: number;
}

export interface RevenuePoint {
  period: string;
  orders: number;
  revenue: number;
}

export interface TopProductRow {
  productCode: string;
  productName: string;
  productId: number | null;
  productSlug: string | null;
  quantity: number;
  revenue: number;
}

export interface LowStockRow {
  productId: number;
  productCode: string;
  productName: string;
  variantId: number;
  sku: string;
  size: string;
  stock: number;
}

export interface TopCustomerRow {
  userId: number;
  fullName: string;
  phone: string;
  orders: number;
  totalSpent: number;
}

/** Định dạng nhóm theo kỳ: hằng số cố định, không bao giờ lấy từ input người dùng. Cộng 7 giờ để ra giờ Việt Nam. */
const PERIOD_FORMAT: Record<Granularity, string> = { day: '%Y-%m-%d', month: '%Y-%m', year: '%Y' };

/**
 * Doanh thu = đơn delivered, theo thời điểm dòng lịch sử `delivered` (mỗi đơn tối đa một dòng như vậy).
 * Điều kiện h.status + h.createdAt dùng chỉ mục idx_order_status_history_status_createdAt.
 */
const DELIVERED_FROM = `
  FROM order_status_history h
  JOIN orders o ON o.id = h.orderId AND o.status = 'delivered'
  WHERE h.status = 'delivered' AND h.createdAt >= ? AND h.createdAt < ?`;

@Injectable()
export class StatsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async countPendingOrders(): Promise<number> {
    return this.count("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'");
  }

  async countCustomers(): Promise<number> {
    return this.count("SELECT COUNT(*) AS n FROM users WHERE role = 'user'");
  }

  async countActiveProducts(): Promise<number> {
    return this.count('SELECT COUNT(*) AS n FROM products WHERE isActive = 1');
  }

  async countLowStockProducts(threshold: number): Promise<number> {
    return this.count(
      `SELECT COUNT(DISTINCT p.id) AS n FROM products p
       JOIN product_variants v ON v.productId = p.id
       WHERE p.isActive = 1 AND v.isActive = 1 AND v.stock <= ?`,
      [threshold],
    );
  }

  async deliveredAggregate(startUtc: Date, endUtcExclusive: Date): Promise<DeliveredAggregate> {
    const rows: { orders: string; revenue: string }[] = await this.dataSource.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(o.total), 0) AS revenue ${DELIVERED_FROM}`,
      [startUtc, endUtcExclusive],
    );
    return { orders: Number(rows[0].orders), revenue: Number(rows[0].revenue) };
  }

  async revenueByPeriod(granularity: Granularity, startUtc: Date, endUtcExclusive: Date): Promise<RevenuePoint[]> {
    const format = PERIOD_FORMAT[granularity];
    const rows: { period: string; orders: string; revenue: string }[] = await this.dataSource.query(
      `SELECT DATE_FORMAT(DATE_ADD(h.createdAt, INTERVAL 7 HOUR), '${format}') AS period,
              COUNT(*) AS orders, COALESCE(SUM(o.total), 0) AS revenue
       ${DELIVERED_FROM}
       GROUP BY period ORDER BY period ASC`,
      [startUtc, endUtcExclusive],
    );
    return rows.map((row) => ({ period: row.period, orders: Number(row.orders), revenue: Number(row.revenue) }));
  }

  /** Theo trạng thái HIỆN TẠI của các đơn có createdAt trong khoảng (chỉ mục idx_orders_status_createdAt). */
  async countOrdersByStatus(startUtc: Date, endUtcExclusive: Date): Promise<Map<string, number>> {
    const rows: { status: string; n: string }[] = await this.dataSource.query(
      'SELECT status, COUNT(*) AS n FROM orders WHERE createdAt >= ? AND createdAt < ? GROUP BY status',
      [startUtc, endUtcExclusive],
    );
    return new Map(rows.map((row) => [row.status, Number(row.n)]));
  }

  async topProducts(startUtc: Date, endUtcExclusive: Date, limit: number): Promise<TopProductRow[]> {
    const rows: {
      productCode: string;
      productName: string;
      productId: number | null;
      productSlug: string | null;
      quantity: string;
      revenue: string;
    }[] = await this.dataSource.query(
      `SELECT oi.productCode, MAX(oi.productName) AS productName, MAX(p.id) AS productId, MAX(p.slug) AS productSlug,
              SUM(oi.quantity) AS quantity, SUM(oi.lineTotal) AS revenue
       FROM order_status_history h
       JOIN orders o ON o.id = h.orderId AND o.status = 'delivered'
       JOIN order_items oi ON oi.orderId = o.id
       LEFT JOIN product_variants v ON v.id = oi.variantId
       LEFT JOIN products p ON p.id = v.productId
       WHERE h.status = 'delivered' AND h.createdAt >= ? AND h.createdAt < ?
       GROUP BY oi.productCode
       ORDER BY quantity DESC, revenue DESC, oi.productCode ASC
       LIMIT ?`,
      [startUtc, endUtcExclusive, limit],
    );
    return rows.map((row) => ({ ...row, quantity: Number(row.quantity), revenue: Number(row.revenue) }));
  }

  async lowStock(threshold: number, limit: number): Promise<LowStockRow[]> {
    return this.dataSource.query(
      `SELECT p.id AS productId, p.code AS productCode, p.name AS productName, v.id AS variantId, v.sku, v.size, v.stock
       FROM product_variants v JOIN products p ON p.id = v.productId
       WHERE p.isActive = 1 AND v.isActive = 1 AND v.stock <= ?
       ORDER BY v.stock ASC, p.code ASC, v.id ASC LIMIT ?`,
      [threshold, limit],
    );
  }

  async topCustomers(startUtc: Date, endUtcExclusive: Date, limit: number): Promise<TopCustomerRow[]> {
    const rows: { userId: number; fullName: string; phone: string; orders: string; totalSpent: string }[] =
      await this.dataSource.query(
        `SELECT o.userId, u.fullName, u.phone, COUNT(*) AS orders, SUM(o.total) AS totalSpent
         FROM order_status_history h
         JOIN orders o ON o.id = h.orderId AND o.status = 'delivered'
         JOIN users u ON u.id = o.userId
         WHERE h.status = 'delivered' AND h.createdAt >= ? AND h.createdAt < ?
         GROUP BY o.userId, u.fullName, u.phone
         ORDER BY totalSpent DESC, orders DESC, o.userId ASC LIMIT ?`,
        [startUtc, endUtcExclusive, limit],
      );
    return rows.map((row) => ({ ...row, orders: Number(row.orders), totalSpent: Number(row.totalSpent) }));
  }

  /** Chạy EXPLAIN cho một truy vấn thống kê (dùng khi kiểm thử chỉ mục). */
  explain(sql: string, params: unknown[]): Promise<unknown[]> {
    return this.dataSource.query(`EXPLAIN ${sql}`, params);
  }

  private async count(sql: string, params: unknown[] = []): Promise<number> {
    const rows: { n: string }[] = await this.dataSource.query(sql, params);
    return Number(rows[0]?.n ?? 0);
  }
}
