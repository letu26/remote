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
const RECALCULATE_PRODUCT_RATING = `
  UPDATE products SET
    avgRating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE productId = ? AND isHidden = 0), 0),
    reviewCount = (SELECT COUNT(*) FROM reviews WHERE productId = ? AND isHidden = 0)
  WHERE id = ?`;
let ReviewRepository = class ReviewRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    create(data) {
        return this.dataSource.transaction(async (manager) => {
            await this.lockProduct(manager, data.productId);
            const result = await manager.query('INSERT INTO reviews (userId, productId, orderItemId, rating, comment, isHidden) VALUES (?, ?, ?, ?, ?, 0)', [data.userId, data.productId, data.orderItemId, data.rating, data.comment]);
            await this.recalculate(manager, data.productId);
            return result.insertId;
        });
    }
    async withLockedReview(where, work) {
        const owner = await this.dataSource.query(`SELECT productId FROM reviews WHERE id = ?${where.userId === undefined ? '' : ' AND userId = ?'}`, where.userId === undefined ? [where.id] : [where.id, where.userId]);
        if (!owner.length)
            return null;
        return this.dataSource.transaction(async (manager) => {
            await this.lockProduct(manager, owner[0].productId);
            const rows = await manager.query(`SELECT id, userId, productId, isHidden FROM reviews WHERE id = ?${where.userId === undefined ? '' : ' AND userId = ?'} FOR UPDATE`, where.userId === undefined ? [where.id] : [where.id, where.userId]);
            if (!rows.length)
                return null;
            const review = { ...rows[0], isHidden: toBool(rows[0].isHidden) };
            return work({
                review,
                update: async (fields) => {
                    const sets = [];
                    const params = [];
                    if (fields.rating !== undefined) {
                        sets.push('rating = ?');
                        params.push(fields.rating);
                    }
                    if (fields.comment !== undefined) {
                        sets.push('comment = ?');
                        params.push(fields.comment);
                    }
                    if (!sets.length)
                        return;
                    await manager.query(`UPDATE reviews SET ${sets.join(', ')} WHERE id = ?`, [...params, review.id]);
                    await this.recalculate(manager, review.productId);
                },
                setHidden: async (isHidden) => {
                    await manager.query('UPDATE reviews SET isHidden = ? WHERE id = ?', [isHidden ? 1 : 0, review.id]);
                    await this.recalculate(manager, review.productId);
                },
                remove: async () => {
                    await manager.query('DELETE FROM reviews WHERE id = ?', [review.id]);
                    await this.recalculate(manager, review.productId);
                },
            });
        });
    }
    async lockProduct(manager, productId) {
        await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
    }
    async recalculate(manager, productId) {
        await manager.query(RECALCULATE_PRODUCT_RATING, [productId, productId, productId]);
    }
};
ReviewRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], ReviewRepository);
export { ReviewRepository };
//# sourceMappingURL=review.repository.js.map