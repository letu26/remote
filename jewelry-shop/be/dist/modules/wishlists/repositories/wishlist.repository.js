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
import { getDuplicateInfo } from '../../../utils/db-error.util.js';
let WishlistRepository = class WishlistRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findActiveProductCategoryId(productId) {
        const rows = await this.dataSource.query('SELECT categoryId FROM products WHERE id = ? AND isActive = 1 LIMIT 1', [productId]);
        return rows[0]?.categoryId ?? null;
    }
    async add(userId, productId) {
        try {
            await this.dataSource.query('INSERT INTO wishlists (userId, productId) VALUES (?, ?)', [userId, productId]);
            return true;
        }
        catch (error) {
            if (getDuplicateInfo(error))
                return false;
            throw error;
        }
    }
    async remove(userId, productId) {
        await this.dataSource.query('DELETE FROM wishlists WHERE userId = ? AND productId = ?', [userId, productId]);
    }
    async findAllProductIds(userId) {
        const rows = await this.dataSource.query('SELECT productId FROM wishlists WHERE userId = ? ORDER BY createdAt DESC, id DESC', [userId]);
        return rows.map((row) => row.productId);
    }
    async findPage(userId, categoryIds, limit, offset) {
        const from = `FROM wishlists w JOIN products p ON p.id = w.productId AND p.isActive = 1
                  WHERE w.userId = ? AND p.categoryId IN (?)`;
        const [countRows, entries] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*) AS total ${from}`, [userId, categoryIds]),
            this.dataSource.query(`SELECT w.productId, w.createdAt AS addedAt ${from} ORDER BY w.createdAt DESC, w.id DESC LIMIT ? OFFSET ?`, [userId, categoryIds, limit, offset]),
        ]);
        return { entries, total: Number(countRows[0]?.total ?? 0) };
    }
};
WishlistRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], WishlistRepository);
export { WishlistRepository };
//# sourceMappingURL=wishlist.repository.js.map