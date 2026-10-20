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
export const ACTIVE_PROMOTION_JOIN = `
  LEFT JOIN (
    SELECT productId, MAX(discountPercent) AS discountPercent
    FROM promotions
    WHERE isActive = 1 AND startsAt <= ? AND endsAt >= ?
    GROUP BY productId
  ) pr ON pr.productId = p.id`;
const EFFECTIVE_PRICE = 'IF(pr.discountPercent IS NULL, p.price, ROUND(p.price * (100 - pr.discountPercent) / 100))';
const ORDER_BY = {
    newest: 'p.createdAt DESC, p.id DESC',
    price_asc: `${EFFECTIVE_PRICE} ASC, p.id DESC`,
    price_desc: `${EFFECTIVE_PRICE} DESC, p.id DESC`,
    bestseller: 'p.soldCount DESC, p.id DESC',
    rating: 'p.avgRating DESC, p.reviewCount DESC, p.id DESC',
};
const IN_STOCK_EXISTS = 'EXISTS (SELECT 1 FROM product_variants v WHERE v.productId = p.id AND v.isActive = 1 AND v.stock > 0)';
const escapeLike = (value) => value.replace(/[\\%_]/g, (c) => `\\${c}`);
let ProductQueryRepository = class ProductQueryRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async count(filter, now) {
        const { where, params } = this.buildWhere(filter);
        const rows = await this.dataSource.query(`SELECT COUNT(*) AS total FROM products p ${ACTIVE_PROMOTION_JOIN} WHERE ${where}`, [now, now, ...params]);
        return Number(rows[0]?.total ?? 0);
    }
    async findPage(filter, sort, limit, offset, now) {
        const { where, params } = this.buildWhere(filter);
        return this.queryListRows(where, params, ORDER_BY[sort], limit, offset, now);
    }
    async findActiveByIds(ids, now) {
        if (!ids.length)
            return [];
        const rows = await this.queryListRows('p.isActive = 1 AND p.id IN (?)', [ids], 'p.id ASC', ids.length, 0, now);
        const byId = new Map(rows.map((row) => [row.id, row]));
        return ids.flatMap((id) => {
            const row = byId.get(id);
            return row ? [row] : [];
        });
    }
    async queryListRows(where, params, orderBy, limit, offset, now) {
        const rows = await this.dataSource.query(`SELECT p.id, p.code, p.name, p.slug, p.price, pr.discountPercent, p.categoryId, p.avgRating,
              p.reviewCount, p.isFeatured, p.targetGroup, ${IN_STOCK_EXISTS} AS inStock
       FROM products p ${ACTIVE_PROMOTION_JOIN}
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`, [now, now, ...params, limit, offset]);
        const ids = rows.map((row) => row.id);
        const [images, variants] = await Promise.all([this.findPrimaryImageUrls(ids), this.findVariantSummaries(ids)]);
        return rows.map((row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            slug: row.slug,
            price: Number(row.price),
            discountPercent: row.discountPercent,
            categoryId: row.categoryId,
            primaryImageUrl: images.get(row.id) ?? null,
            inStock: toBool(row.inStock),
            variantCount: variants.get(row.id)?.count ?? 0,
            singleVariantId: variants.get(row.id)?.count === 1 ? (variants.get(row.id)?.minId ?? null) : null,
            avgRating: Number(row.avgRating),
            reviewCount: row.reviewCount,
            isFeatured: toBool(row.isFeatured),
            targetGroup: row.targetGroup,
        }));
    }
    async findActiveBySlug(slug, now) {
        const rows = await this.dataSource.query(`SELECT p.id, p.code, p.name, p.slug, p.description, p.price, pr.discountPercent, p.targetGroup, p.weight,
              p.warrantyInfo, p.certificate, p.isFeatured, p.avgRating, p.reviewCount, p.soldCount,
              p.categoryId, p.materialId, p.collectionId
       FROM products p ${ACTIVE_PROMOTION_JOIN}
       WHERE p.slug = ? AND p.isActive = 1
       LIMIT 1`, [now, now, slug]);
        const row = rows[0];
        if (!row)
            return null;
        return {
            ...row,
            price: Number(row.price),
            weight: row.weight == null ? null : Number(row.weight),
            avgRating: Number(row.avgRating),
            isFeatured: toBool(row.isFeatured),
        };
    }
    async findImages(productId) {
        const rows = await this.dataSource.query('SELECT id, url, isPrimary, sortOrder FROM product_images WHERE productId = ? ORDER BY sortOrder ASC, id ASC', [productId]);
        return rows.map((row) => ({ ...row, isPrimary: toBool(row.isPrimary) }));
    }
    async findActiveVariants(productId) {
        const rows = await this.dataSource.query('SELECT id, sku, size, stock, isActive FROM product_variants WHERE productId = ? AND isActive = 1 ORDER BY id ASC', [productId]);
        return rows.map((row) => ({ ...row, isActive: toBool(row.isActive) }));
    }
    async findGemstones(productId) {
        const rows = await this.dataSource.query(`SELECT pg.id, pg.gemstoneId, g.name, pg.quantity, pg.carat, pg.color, pg.clarity, pg.cut
       FROM product_gemstones pg JOIN gemstones g ON g.id = pg.gemstoneId
       WHERE pg.productId = ? ORDER BY pg.id ASC`, [productId]);
        return rows.map((row) => ({ ...row, carat: row.carat == null ? null : Number(row.carat) }));
    }
    async findVariantSummaries(productIds) {
        const result = new Map();
        if (!productIds.length)
            return result;
        const rows = await this.dataSource.query('SELECT productId, COUNT(*) AS n, MIN(id) AS minId FROM product_variants WHERE productId IN (?) AND isActive = 1 GROUP BY productId', [productIds]);
        for (const row of rows)
            result.set(row.productId, { count: Number(row.n), minId: row.minId });
        return result;
    }
    async findPrimaryImageUrls(productIds) {
        const result = new Map();
        if (!productIds.length)
            return result;
        const rows = await this.dataSource.query(`SELECT productId, url FROM product_images WHERE productId IN (?)
       ORDER BY productId, isPrimary DESC, sortOrder ASC, id ASC`, [productIds]);
        for (const row of rows)
            if (!result.has(row.productId))
                result.set(row.productId, row.url);
        return result;
    }
    buildWhere(filter) {
        const conditions = ['p.isActive = 1', 'p.categoryId IN (?)'];
        const params = [filter.categoryIds];
        if (filter.collectionId !== undefined) {
            conditions.push('p.collectionId = ?');
            params.push(filter.collectionId);
        }
        if (filter.materialId !== undefined) {
            conditions.push('p.materialId = ?');
            params.push(filter.materialId);
        }
        if (filter.gemstoneIds?.length) {
            conditions.push('EXISTS (SELECT 1 FROM product_gemstones g WHERE g.productId = p.id AND g.gemstoneId IN (?))');
            params.push(filter.gemstoneIds);
        }
        if (filter.targetGroups?.length) {
            conditions.push('p.targetGroup IN (?)');
            params.push(filter.targetGroups);
        }
        if (filter.minPrice !== undefined) {
            conditions.push(`${EFFECTIVE_PRICE} >= ?`);
            params.push(filter.minPrice);
        }
        if (filter.maxPrice !== undefined) {
            conditions.push(`${EFFECTIVE_PRICE} <= ?`);
            params.push(filter.maxPrice);
        }
        if (filter.q) {
            conditions.push('(p.name LIKE ? OR p.code LIKE ?)');
            const pattern = `%${escapeLike(filter.q)}%`;
            params.push(pattern, pattern);
        }
        if (filter.inStock)
            conditions.push(IN_STOCK_EXISTS);
        if (filter.onSale)
            conditions.push('pr.discountPercent IS NOT NULL');
        if (filter.featured)
            conditions.push('p.isFeatured = 1');
        if (filter.excludeProductId !== undefined) {
            conditions.push('p.id <> ?');
            params.push(filter.excludeProductId);
        }
        return { where: conditions.join(' AND '), params };
    }
};
ProductQueryRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], ProductQueryRepository);
export { ProductQueryRepository };
//# sourceMappingURL=product-query.repository.js.map