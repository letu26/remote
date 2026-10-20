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
const ORDER_COLUMNS = `o.id, o.code, o.userId, o.createdAt, o.status, o.paymentMethod, o.paymentStatus, o.paidAt,
  o.cancelReason, o.note, o.receiverName, o.receiverPhone, o.provinceName, o.wardName, o.addressDetail,
  o.shippingMethodName, o.subtotal, o.shippingFee, o.total`;
const toOrder = (row) => ({
    ...row,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shippingFee),
    total: Number(row.total),
});
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');
let OrderQueryRepository = class OrderQueryRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findByCode(userId, code) {
        const rows = await this.dataSource.query(`SELECT ${ORDER_COLUMNS} FROM orders o WHERE o.code = ? AND o.userId = ?`, [code, userId]);
        return rows[0] ? toOrder(rows[0]) : null;
    }
    async findById(id) {
        const rows = await this.dataSource.query(`SELECT ${ORDER_COLUMNS} FROM orders o WHERE o.id = ?`, [id]);
        return rows[0] ? toOrder(rows[0]) : null;
    }
    async findItems(orderId) {
        const rows = await this.dataSource.query(`SELECT oi.productName, oi.productCode, p.slug AS productSlug, oi.size, oi.imageUrl, oi.unitPrice,
                oi.quantity, oi.lineTotal
         FROM order_items oi
         LEFT JOIN product_variants v ON v.id = oi.variantId
         LEFT JOIN products p ON p.id = v.productId
         WHERE oi.orderId = ? ORDER BY oi.id ASC`, [orderId]);
        return rows.map((row) => ({ ...row, unitPrice: Number(row.unitPrice), lineTotal: Number(row.lineTotal) }));
    }
    findHistory(orderId) {
        return this.dataSource.query(`SELECT h.status, h.note, h.createdAt, u.fullName AS changedByName
       FROM order_status_history h LEFT JOIN users u ON u.id = h.changedById
       WHERE h.orderId = ? ORDER BY h.createdAt ASC, h.id ASC`, [orderId]);
    }
    async findCustomer(userId) {
        const rows = await this.dataSource.query('SELECT id, fullName, phone, email FROM users WHERE id = ?', [userId]);
        return rows[0] ?? null;
    }
    async findCustomerPage(userId, status, limit, offset) {
        const where = status ? 'o.userId = ? AND o.status = ?' : 'o.userId = ?';
        const params = status ? [userId, status] : [userId];
        return this.findPage(where, params, limit, offset);
    }
    async findAdminPage(filter, limit, offset) {
        const conditions = ['1 = 1'];
        const params = [];
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
    async findItemPreviews(orderIds, limit) {
        const result = new Map();
        if (!orderIds.length)
            return result;
        const rows = await this.dataSource.query('SELECT orderId, productName, size, imageUrl, quantity FROM order_items WHERE orderId IN (?) ORDER BY orderId, id', [orderIds]);
        for (const { orderId, ...item } of rows) {
            const entry = result.get(orderId) ?? { itemCount: 0, items: [] };
            entry.itemCount += 1;
            if (entry.items.length < limit)
                entry.items.push(item);
            result.set(orderId, entry);
        }
        return result;
    }
    async findPage(where, params, limit, offset) {
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*) AS total FROM orders o WHERE ${where}`, params),
            this.dataSource.query(`SELECT o.id, o.code, o.createdAt, o.status, o.paymentMethod, o.paymentStatus, o.total,
                o.receiverName, o.receiverPhone
         FROM orders o WHERE ${where}
         ORDER BY o.createdAt DESC, o.id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
        ]);
        return {
            total: Number(countRows[0]?.total ?? 0),
            rows: rows.map((row) => ({ ...row, total: Number(row.total) })),
        };
    }
};
OrderQueryRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], OrderQueryRepository);
export { OrderQueryRepository };
//# sourceMappingURL=order-query.repository.js.map