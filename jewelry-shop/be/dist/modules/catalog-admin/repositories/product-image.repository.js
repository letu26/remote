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
import { toBool } from '../../../utils/db-error.util.js';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProductImage } from '../../catalog/models/product-image.entity.js';
const toRecord = (row) => ({ ...row, isPrimary: toBool(row.isPrimary) });
let ProductImageRepository = class ProductImageRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async productExists(productId) {
        const rows = await this.dataSource.query('SELECT 1 FROM products WHERE id = ? LIMIT 1', [productId]);
        return rows.length > 0;
    }
    async countByProduct(productId) {
        const rows = await this.dataSource.query('SELECT COUNT(*) AS total FROM product_images WHERE productId = ?', [productId]);
        return Number(rows[0]?.total ?? 0);
    }
    async findByProduct(productId) {
        const rows = await this.dataSource.query('SELECT id, url, publicId, isPrimary, sortOrder FROM product_images WHERE productId = ? ORDER BY sortOrder ASC, id ASC', [productId]);
        return rows.map(toRecord);
    }
    async findOne(productId, imageId) {
        const rows = await this.dataSource.query('SELECT id, url, publicId, isPrimary, sortOrder FROM product_images WHERE id = ? AND productId = ?', [imageId, productId]);
        return rows[0] ? toRecord(rows[0]) : null;
    }
    addAll(productId, uploaded, maxImages) {
        return this.dataSource.transaction(async (manager) => {
            const locked = await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
            if (!locked.length)
                return { ok: false, reason: 'product_missing' };
            const stats = await manager.query(`SELECT COUNT(*) AS total, MAX(sortOrder) AS maxOrder, COALESCE(SUM(isPrimary), 0) AS primaries
         FROM product_images WHERE productId = ?`, [productId]);
            const total = Number(stats[0].total);
            if (total + uploaded.length > maxImages)
                return { ok: false, reason: 'limit' };
            let nextOrder = stats[0].maxOrder == null ? 0 : Number(stats[0].maxOrder) + 1;
            const needsPrimary = Number(stats[0].primaries) === 0;
            const saved = await manager.save(ProductImage, uploaded.map((item, index) => manager.create(ProductImage, {
                productId,
                url: item.url,
                publicId: item.publicId,
                sortOrder: nextOrder++,
                isPrimary: needsPrimary && index === 0,
            })));
            return {
                ok: true,
                images: saved.map((row) => ({
                    id: row.id,
                    url: row.url,
                    publicId: row.publicId,
                    isPrimary: row.isPrimary,
                    sortOrder: row.sortOrder,
                })),
            };
        });
    }
    update(productId, imageId, data) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
            if (data.sortOrder !== undefined) {
                await manager.query('UPDATE product_images SET sortOrder = ? WHERE id = ? AND productId = ?', [
                    data.sortOrder,
                    imageId,
                    productId,
                ]);
            }
            if (data.isPrimary === true) {
                await manager.query('UPDATE product_images SET isPrimary = (id = ?) WHERE productId = ?', [imageId, productId]);
            }
        });
    }
    reorder(productId, orderedIds) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
            for (const [index, imageId] of orderedIds.entries()) {
                await manager.query('UPDATE product_images SET sortOrder = ? WHERE id = ? AND productId = ?', [
                    index,
                    imageId,
                    productId,
                ]);
            }
        });
    }
    remove(productId, imageId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
            const rows = await manager.query('SELECT publicId, isPrimary FROM product_images WHERE id = ? AND productId = ?', [imageId, productId]);
            if (!rows.length)
                return null;
            await manager.query('DELETE FROM product_images WHERE id = ? AND productId = ?', [imageId, productId]);
            if (rows[0].isPrimary) {
                await manager.query(`UPDATE product_images SET isPrimary = 1 WHERE productId = ?
           ORDER BY sortOrder ASC, id ASC LIMIT 1`, [productId]);
            }
            return { publicId: rows[0].publicId };
        });
    }
};
ProductImageRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], ProductImageRepository);
export { ProductImageRepository };
//# sourceMappingURL=product-image.repository.js.map