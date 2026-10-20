var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
const PERIOD_FORMAT = { day: '%Y-%m-%d', month: '%Y-%m', year: '%Y' };
const DELIVERED_FROM = `
  FROM order_status_history h
  JOIN orders o ON o.id = h.orderId AND o.status = 'delivered'
  WHERE h.status = 'delivered' AND h.createdAt >= ? AND h.createdAt < ?`;
let StatsRepository = class StatsRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async countPendingOrders() {
        return this.count("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'");
    }
    async countCustomers() {
        return this.count("SELECT COUNT(*) AS n FROM users WHERE role = 'user'");
    }
    async countActiveProducts() {
        return this.count('SELECT COUNT(*) AS n FROM products WHERE isActive = 1');
    }
    async countLowStockProducts(threshold) {
        return this.count(`SELECT COUNT(DISTINCT p.id) AS n FROM products p
       JOIN product_variants v ON v.productId = p.id
       WHERE p.isActive = 1 AND v.isActive = 1 AND v.stock <= ?`, [threshold]);
    }
    async deliveredAggregate(startUtc, endUtcExclusive) {
        const rows = await this.dataSource.query(`SELECT COUNT(*) AS orders, COALESCE(SUM(o.total), 0) AS revenue ${DELIVERED_FROM}`, [startUtc, endUtcExclusive]);
        return { orders: Number(rows[0].orders), revenue: Number(rows[0].revenue) };
    }
    async revenueByPeriod(granularity, startUtc, endUtcExclusive) {
        const format = PERIOD_FORMAT[granularity];
        const rows = await this.dataSource.query(`SELECT DATE_FORMAT(DATE_ADD(h.createdAt, INTERVAL 7 HOUR), '${format}') AS period,
              COUNT(*) AS orders, COALESCE(SUM(o.total), 0) AS revenue
       ${DELIVERED_FROM}
       GROUP BY period ORDER BY period ASC`, [startUtc, endUtcExclusive]);
        return rows.map((row) => ({ period: row.period, orders: Number(row.orders), revenue: Number(row.revenue) }));
    }
    async countOrdersByStatus(startUtc, endUtcExclusive) {
        const rows = await this.dataSource.query('SELECT status, COUNT(*) AS n FROM orders WHERE createdAt >= ? AND createdAt < ? GROUP BY status', [startUtc, endUtcExclusive]);
        return new Map(rows.map((row) => [row.status, Number(row.n)]));
    }
    async topProducts(startUtc, endUtcExclusive, limit) {
        const rows = await this.dataSource.query(`SELECT oi.productCode, MAX(oi.productName) AS productName, MAX(p.id) AS productId, MAX(p.slug) AS productSlug,
              SUM(oi.quantity) AS quantity, SUM(oi.lineTotal) AS revenue
       FROM order_status_history h
       JOIN orders o ON o.id = h.orderId AND o.status = 'delivered'
       JOIN order_items oi ON oi.orderId = o.id
       LEFT JOIN product_variants v ON v.id = oi.variantId
       LEFT JOIN products p ON p.id = v.productId
       WHERE h.status = 'delivered' AND h.createdAt >= ? AND h.createdAt < ?
       GROUP BY oi.productCode
       ORDER BY quantity DESC, revenue DESC, oi.productCode ASC
       LIMIT ?`, [startUtc, endUtcExclusive, limit]);
        return rows.map((row) => ({ ...row, quantity: Number(row.quantity), revenue: Number(row.revenue) }));
    }
    async lowStock(threshold, limit) {
        return this.dataSource.query(`SELECT p.id AS productId, p.code AS productCode, p.name AS productName, v.id AS variantId, v.sku, v.size, v.stock
       FROM product_variants v JOIN products p ON p.id = v.productId
       WHERE p.isActive = 1 AND v.isActive = 1 AND v.stock <= ?
       ORDER BY v.stock ASC, p.code ASC, v.id ASC LIMIT ?`, [threshold, limit]);
    }
    async topCustomers(startUtc, endUtcExclusive, limit) {
        const rows = await this.dataSource.query(`SELECT o.userId, u.fullName, u.phone, COUNT(*) AS orders, SUM(o.total) AS totalSpent
         FROM order_status_history h
         JOIN orders o ON o.id = h.orderId AND o.status = 'delivered'
         JOIN users u ON u.id = o.userId
         WHERE h.status = 'delivered' AND h.createdAt >= ? AND h.createdAt < ?
         GROUP BY o.userId, u.fullName, u.phone
         ORDER BY totalSpent DESC, orders DESC, o.userId ASC LIMIT ?`, [startUtc, endUtcExclusive, limit]);
        return rows.map((row) => ({ ...row, orders: Number(row.orders), totalSpent: Number(row.totalSpent) }));
    }
    explain(sql, params) {
        return this.dataSource.query(`EXPLAIN ${sql}`, params);
    }
    async count(sql, params = []) {
        const rows = await this.dataSource.query(sql, params);
        return Number(rows[0]?.n ?? 0);
    }
};
StatsRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], StatsRepository);
export { StatsRepository };
//# sourceMappingURL=stats.repository.js.map