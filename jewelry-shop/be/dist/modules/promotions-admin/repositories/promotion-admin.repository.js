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
const SELECT_ROWS = `
  SELECT pr.id, pr.name, pr.productId, p.code AS productCode, p.name AS productName, pr.discountPercent,
         pr.startsAt, pr.endsAt, pr.isActive, pr.createdAt
  FROM promotions pr JOIN products p ON p.id = pr.productId`;
const toRow = (row) => ({ ...row, isActive: toBool(row.isActive) });
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');
const STATUS_CONDITIONS = {
    disabled: 'pr.isActive = 0',
    expired: 'pr.isActive = 1 AND pr.endsAt < ?',
    upcoming: 'pr.isActive = 1 AND pr.endsAt >= ? AND pr.startsAt > ?',
    active: 'pr.isActive = 1 AND pr.endsAt >= ? AND pr.startsAt <= ?',
};
const STATUS_PARAM_COUNT = { disabled: 0, expired: 1, upcoming: 2, active: 2 };
let PromotionAdminRepository = class PromotionAdminRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findPage(filter, limit, offset, now) {
        const conditions = ['1 = 1'];
        const params = [];
        if (filter.q) {
            const pattern = `%${escapeLike(filter.q)}%`;
            conditions.push('(pr.name LIKE ? OR p.name LIKE ? OR p.code LIKE ?)');
            params.push(pattern, pattern, pattern);
        }
        if (filter.productId !== undefined) {
            conditions.push('pr.productId = ?');
            params.push(filter.productId);
        }
        if (filter.status) {
            conditions.push(`(${STATUS_CONDITIONS[filter.status]})`);
            for (let i = 0; i < STATUS_PARAM_COUNT[filter.status]; i += 1)
                params.push(now);
        }
        const where = conditions.join(' AND ');
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*) AS total FROM promotions pr JOIN products p ON p.id = pr.productId WHERE ${where}`, params),
            this.dataSource.query(`${SELECT_ROWS} WHERE ${where} ORDER BY pr.createdAt DESC, pr.id DESC LIMIT ? OFFSET ?`, [
                ...params,
                limit,
                offset,
            ]),
        ]);
        return { total: Number(countRows[0]?.total ?? 0), rows: rows.map(toRow) };
    }
    async findByIds(ids) {
        if (!ids.length)
            return [];
        const rows = await this.dataSource.query(`${SELECT_ROWS} WHERE pr.id IN (?) ORDER BY pr.id ASC`, [ids]);
        return rows.map(toRow);
    }
    async findById(id) {
        return (await this.findByIds([id]))[0] ?? null;
    }
    async findExistingProductIds(ids) {
        const rows = await this.dataSource.query('SELECT id FROM products WHERE id IN (?)', [ids]);
        return new Set(rows.map((row) => row.id));
    }
    create(data) {
        return this.dataSource.transaction(async (manager) => {
            const ids = [];
            for (const productId of data.productIds) {
                const result = await manager.query('INSERT INTO promotions (name, productId, discountPercent, startsAt, endsAt, isActive) VALUES (?, ?, ?, ?, ?, ?)', [data.name, productId, data.discountPercent, data.startsAt, data.endsAt, data.isActive ? 1 : 0]);
                ids.push(result.insertId);
            }
            return ids;
        });
    }
    async update(id, data) {
        const sets = [];
        const params = [];
        const add = (column, value) => {
            sets.push(`${column} = ?`);
            params.push(value);
        };
        if (data.name !== undefined)
            add('name', data.name);
        if (data.discountPercent !== undefined)
            add('discountPercent', data.discountPercent);
        if (data.startsAt !== undefined)
            add('startsAt', data.startsAt);
        if (data.endsAt !== undefined)
            add('endsAt', data.endsAt);
        if (data.isActive !== undefined)
            add('isActive', data.isActive ? 1 : 0);
        if (!sets.length)
            return;
        await this.dataSource.query(`UPDATE promotions SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }
    async delete(id) {
        await this.dataSource.query('DELETE FROM promotions WHERE id = ?', [id]);
    }
};
PromotionAdminRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], PromotionAdminRepository);
export { PromotionAdminRepository };
//# sourceMappingURL=promotion-admin.repository.js.map