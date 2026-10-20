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
const COLUMNS = 'id, fullName, phone, email, role, status, createdAt';
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');
let CustomerAdminRepository = class CustomerAdminRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findPage(filter, limit, offset) {
        const conditions = ['1 = 1'];
        const params = [];
        if (filter.q) {
            const pattern = `%${escapeLike(filter.q)}%`;
            conditions.push('(fullName LIKE ? OR phone LIKE ? OR email LIKE ?)');
            params.push(pattern, pattern, pattern);
        }
        if (filter.status) {
            conditions.push('status = ?');
            params.push(filter.status);
        }
        if (filter.role) {
            conditions.push('role = ?');
            params.push(filter.role);
        }
        const where = conditions.join(' AND ');
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*) AS total FROM users WHERE ${where}`, params),
            this.dataSource.query(`SELECT ${COLUMNS} FROM users WHERE ${where} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`, [
                ...params,
                limit,
                offset,
            ]),
        ]);
        return { rows, total: Number(countRows[0]?.total ?? 0) };
    }
    async findById(id) {
        const rows = await this.dataSource.query(`SELECT ${COLUMNS} FROM users WHERE id = ?`, [id]);
        return rows[0] ?? null;
    }
    async findStats(userIds) {
        const result = new Map();
        if (!userIds.length)
            return result;
        const rows = await this.dataSource.query(`SELECT userId,
                SUM(status <> 'cancelled') AS orderCount,
                COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) AS totalSpent,
                MAX(createdAt) AS lastOrderAt
         FROM orders WHERE userId IN (?) GROUP BY userId`, [userIds]);
        for (const row of rows) {
            result.set(row.userId, {
                orderCount: Number(row.orderCount),
                totalSpent: Number(row.totalSpent),
                lastOrderAt: row.lastOrderAt,
            });
        }
        return result;
    }
    async findCounts(userId) {
        const rows = await this.dataSource.query(`SELECT (SELECT COUNT(*) FROM addresses WHERE userId = ?) AS addressCount,
              (SELECT COUNT(*) FROM reviews WHERE userId = ?) AS reviewCount,
              (SELECT COUNT(*) FROM wishlists WHERE userId = ?) AS wishlistCount`, [userId, userId, userId]);
        return {
            addressCount: Number(rows[0].addressCount),
            reviewCount: Number(rows[0].reviewCount),
            wishlistCount: Number(rows[0].wishlistCount),
        };
    }
    async findRecentOrders(userId, limit) {
        const rows = await this.dataSource.query(`SELECT o.id, o.code, o.createdAt, o.status, o.paymentStatus, o.total,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.orderId = o.id) AS itemCount
         FROM orders o WHERE o.userId = ? ORDER BY o.createdAt DESC, o.id DESC LIMIT ?`, [userId, limit]);
        return rows.map((row) => ({ ...row, total: Number(row.total), itemCount: Number(row.itemCount) }));
    }
    async updateStatus(id, status) {
        await this.dataSource.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    }
    async withRoleChange(targetId, work) {
        return this.dataSource.transaction(async (manager) => {
            const admins = await manager.query("SELECT id FROM users WHERE role = 'admin' AND status = 'active' ORDER BY id ASC FOR UPDATE");
            const targets = await manager.query(`SELECT ${COLUMNS} FROM users WHERE id = ? FOR UPDATE`, [targetId]);
            if (!targets.length)
                return null;
            return work({
                target: targets[0],
                activeAdminIds: admins.map((row) => row.id),
                handle: manager,
                setRole: async (role) => {
                    await manager.query('UPDATE users SET role = ? WHERE id = ?', [role, targetId]);
                },
            });
        });
    }
};
CustomerAdminRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], CustomerAdminRepository);
export { CustomerAdminRepository };
//# sourceMappingURL=customer-admin.repository.js.map