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
import { toBool } from '../../../utils/db-error.util.js';
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');
const ADMIN_SELECT = `
  SELECT r.id, r.productId, p.name AS productName, p.code AS productCode, p.slug AS productSlug, r.userId,
         u.fullName AS reviewerName, u.phone AS reviewerPhone, r.rating, r.comment, r.isHidden,
         r.createdAt, r.updatedAt
  FROM reviews r
  JOIN products p ON p.id = r.productId
  JOIN users u ON u.id = r.userId`;
let ReviewQueryRepository = class ReviewQueryRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findActiveProductBySlug(slug) {
        const rows = await this.dataSource.query('SELECT id, categoryId FROM products WHERE slug = ? AND isActive = 1 LIMIT 1', [slug]);
        return rows[0] ?? null;
    }
    async countByRating(productId) {
        const rows = await this.dataSource.query('SELECT rating, COUNT(*) AS n FROM reviews WHERE productId = ? AND isHidden = 0 GROUP BY rating', [productId]);
        return new Map(rows.map((row) => [row.rating, Number(row.n)]));
    }
    async findVisiblePage(productId, rating, limit, offset) {
        const where = rating === undefined ? 'r.productId = ? AND r.isHidden = 0' : 'r.productId = ? AND r.isHidden = 0 AND r.rating = ?';
        const params = rating === undefined ? [productId] : [productId, rating];
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*) AS total FROM reviews r WHERE ${where}`, params),
            this.dataSource.query(`SELECT r.id, r.userId, u.fullName, r.rating, r.comment, r.createdAt, r.updatedAt
         FROM reviews r JOIN users u ON u.id = r.userId
         WHERE ${where}
         ORDER BY r.createdAt DESC, r.id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
        ]);
        return { rows, total: Number(countRows[0]?.total ?? 0) };
    }
    async findByUserAndProduct(userId, productId) {
        const rows = await this.dataSource.query('SELECT id, rating, comment, isHidden, createdAt, updatedAt FROM reviews WHERE userId = ? AND productId = ?', [userId, productId]);
        return rows[0] ? { ...rows[0], isHidden: toBool(rows[0].isHidden) } : null;
    }
    async findById(id) {
        const rows = await this.dataSource.query('SELECT id, rating, comment, isHidden, createdAt, updatedAt FROM reviews WHERE id = ?', [id]);
        return rows[0] ? { ...rows[0], isHidden: toBool(rows[0].isHidden) } : null;
    }
    async findLatestDeliveredOrderItemId(userId, productId) {
        const rows = await this.dataSource.query(`SELECT oi.id
       FROM order_items oi
       JOIN orders o ON o.id = oi.orderId
       JOIN product_variants v ON v.id = oi.variantId
       WHERE o.userId = ? AND o.status = 'delivered' AND v.productId = ?
       ORDER BY o.createdAt DESC, oi.id DESC LIMIT 1`, [userId, productId]);
        return rows[0]?.id ?? null;
    }
    async findMinePage(userId, limit, offset) {
        const [countRows, rows] = await Promise.all([
            this.dataSource.query('SELECT COUNT(*) AS total FROM reviews WHERE userId = ?', [userId]),
            this.dataSource.query(`SELECT r.id, r.productId, p.name AS productName, p.slug AS productSlug, r.rating, r.comment, r.isHidden,
                r.createdAt, r.updatedAt
         FROM reviews r JOIN products p ON p.id = r.productId
         WHERE r.userId = ? ORDER BY r.createdAt DESC, r.id DESC LIMIT ? OFFSET ?`, [userId, limit, offset]),
        ]);
        return {
            total: Number(countRows[0]?.total ?? 0),
            rows: rows.map((row) => ({ ...row, isHidden: toBool(row.isHidden) })),
        };
    }
    async findAdminPage(filter, limit, offset) {
        const conditions = ['1 = 1'];
        const params = [];
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
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*) AS total FROM reviews r JOIN products p ON p.id = r.productId JOIN users u ON u.id = r.userId WHERE ${where}`, params),
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
    async findAdminById(id) {
        const rows = await this.dataSource.query(`${ADMIN_SELECT} WHERE r.id = ?`, [id]);
        return rows[0] ? { ...rows[0], isHidden: toBool(rows[0].isHidden) } : null;
    }
};
ReviewQueryRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], ReviewQueryRepository);
export { ReviewQueryRepository };
//# sourceMappingURL=review-query.repository.js.map