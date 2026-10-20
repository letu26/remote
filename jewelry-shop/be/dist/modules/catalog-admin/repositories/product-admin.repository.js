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
import { ProductGemstone } from '../../catalog/models/product-gemstone.entity.js';
import { ProductVariant } from '../../catalog/models/product-variant.entity.js';
import { Product } from '../../catalog/models/product.entity.js';
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');
let ProductAdminRepository = class ProductAdminRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async findPage(filter, limit, offset) {
        const conditions = ['1 = 1'];
        const params = [];
        if (filter.q) {
            const pattern = `%${escapeLike(filter.q)}%`;
            conditions.push('(p.name LIKE ? OR p.code LIKE ?)');
            params.push(pattern, pattern);
        }
        if (filter.categoryId !== undefined) {
            conditions.push('p.categoryId = ?');
            params.push(filter.categoryId);
        }
        if (filter.isActive !== undefined) {
            conditions.push('p.isActive = ?');
            params.push(filter.isActive ? 1 : 0);
        }
        const where = conditions.join(' AND ');
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*) AS total FROM products p WHERE ${where}`, params),
            this.dataSource.query(`SELECT p.id, p.code, p.name, p.slug, p.price, p.categoryId, c.name AS categoryName,
                p.isActive, p.isFeatured, p.createdAt
         FROM products p JOIN categories c ON c.id = p.categoryId
         WHERE ${where}
         ORDER BY p.createdAt DESC, p.id DESC
         LIMIT ? OFFSET ?`, [...params, limit, offset]),
        ]);
        const ids = rows.map((row) => row.id);
        const [stocks, images] = await Promise.all([this.sumStockByProduct(ids), this.primaryImageUrlByProduct(ids)]);
        return {
            total: Number(countRows[0]?.total ?? 0),
            rows: rows.map((row) => ({
                ...row,
                price: Number(row.price),
                isActive: toBool(row.isActive),
                isFeatured: toBool(row.isFeatured),
                totalStock: stocks.get(row.id) ?? 0,
                primaryImageUrl: images.get(row.id) ?? null,
            })),
        };
    }
    async findById(id) {
        const rows = await this.dataSource.query(`SELECT p.*, c.name AS categoryName FROM products p JOIN categories c ON c.id = p.categoryId WHERE p.id = ?`, [id]);
        const row = rows[0];
        if (!row)
            return null;
        return {
            ...row,
            price: Number(row.price),
            costPrice: Number(row.costPrice),
            weight: row.weight == null ? null : Number(row.weight),
            avgRating: Number(row.avgRating),
            isActive: toBool(row.isActive),
            isFeatured: toBool(row.isFeatured),
            categoryName: row.categoryName,
        };
    }
    async exists(id) {
        const rows = await this.dataSource.query('SELECT 1 FROM products WHERE id = ? LIMIT 1', [id]);
        return rows.length > 0;
    }
    async findSlugsStartingWith(prefix) {
        const rows = await this.dataSource.query('SELECT slug FROM products WHERE slug = ? OR slug LIKE ?', [prefix, `${escapeLike(prefix)}-%`]);
        return rows.map((row) => row.slug);
    }
    async findVariants(productId) {
        const rows = await this.dataSource.query('SELECT id, sku, size, stock, isActive FROM product_variants WHERE productId = ? ORDER BY id ASC', [productId]);
        return rows.map((row) => ({ ...row, isActive: toBool(row.isActive) }));
    }
    async findImages(productId) {
        const rows = await this.dataSource.query('SELECT id, url, publicId, isPrimary, sortOrder FROM product_images WHERE productId = ? ORDER BY sortOrder ASC, id ASC', [productId]);
        return rows.map((row) => ({ ...row, isPrimary: toBool(row.isPrimary) }));
    }
    async findGemstones(productId) {
        const rows = await this.dataSource.query(`SELECT pg.id, pg.gemstoneId, g.name, pg.quantity, pg.carat, pg.color, pg.clarity, pg.cut
       FROM product_gemstones pg JOIN gemstones g ON g.id = pg.gemstoneId
       WHERE pg.productId = ? ORDER BY pg.id ASC`, [productId]);
        return rows.map((row) => ({ ...row, carat: row.carat == null ? null : Number(row.carat) }));
    }
    async categoryExists(id) {
        return this.existsIn('categories', id);
    }
    async materialExists(id) {
        return this.existsIn('materials', id);
    }
    async collectionExists(id) {
        return this.existsIn('collections', id);
    }
    async findExistingGemstoneIds(ids) {
        if (!ids.length)
            return new Set();
        const rows = await this.dataSource.query('SELECT id FROM gemstones WHERE id IN (?)', [ids]);
        return new Set(rows.map((row) => row.id));
    }
    async hasOrderItems(productId) {
        const rows = await this.dataSource.query(`SELECT 1 FROM order_items oi JOIN product_variants v ON v.id = oi.variantId WHERE v.productId = ? LIMIT 1`, [productId]);
        return rows.length > 0;
    }
    create(scalars, gemstones, variants) {
        return this.dataSource.transaction(async (manager) => {
            const product = await manager.save(manager.create(Product, {
                code: scalars.code,
                name: scalars.name,
                slug: scalars.slug,
                description: scalars.description ?? null,
                categoryId: scalars.categoryId,
                materialId: scalars.materialId ?? null,
                collectionId: scalars.collectionId ?? null,
                targetGroup: scalars.targetGroup,
                weight: scalars.weight ?? null,
                costPrice: scalars.costPrice ?? 0,
                price: scalars.price,
                warrantyInfo: scalars.warrantyInfo ?? null,
                certificate: scalars.certificate ?? null,
                isFeatured: scalars.isFeatured ?? false,
                isActive: scalars.isActive ?? true,
            }));
            await this.insertGemstones(manager, product.id, gemstones);
            await this.insertVariants(manager, product.id, variants);
            return product.id;
        });
    }
    update(id, scalars, gemstones, variantPlan) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [id]);
            if (Object.keys(scalars).length)
                await manager.update(Product, { id }, scalars);
            if (gemstones) {
                await manager.delete(ProductGemstone, { productId: id });
                await this.insertGemstones(manager, id, gemstones);
            }
            if (variantPlan) {
                for (const item of variantPlan.update) {
                    await manager.update(ProductVariant, { id: item.id, productId: id }, { sku: item.sku, size: item.size, ...(item.isActive === undefined ? {} : { isActive: item.isActive }) });
                }
                if (variantPlan.deactivateIds.length) {
                    await manager.query('UPDATE product_variants SET isActive = 0 WHERE productId = ? AND id IN (?)', [
                        id,
                        variantPlan.deactivateIds,
                    ]);
                }
                await this.insertVariants(manager, id, variantPlan.create);
            }
        });
    }
    remove(id) {
        return this.dataSource.transaction(async (manager) => {
            const images = await manager.query('SELECT publicId FROM product_images WHERE productId = ?', [id]);
            await manager.query('DELETE FROM cart_items WHERE variantId IN (SELECT id FROM product_variants WHERE productId = ?)', [id]);
            await manager.query('DELETE FROM reviews WHERE productId = ?', [id]);
            await manager.query('DELETE FROM wishlists WHERE productId = ?', [id]);
            await manager.query('DELETE FROM promotions WHERE productId = ?', [id]);
            await manager.query('DELETE FROM product_gemstones WHERE productId = ?', [id]);
            await manager.query('DELETE FROM product_images WHERE productId = ?', [id]);
            await manager.query('DELETE FROM product_variants WHERE productId = ?', [id]);
            await manager.query('DELETE FROM products WHERE id = ?', [id]);
            return images.map((row) => row.publicId).filter((publicId) => Boolean(publicId));
        });
    }
    async findVariant(productId, variantId) {
        const rows = await this.dataSource.query('SELECT id, sku, size, stock, isActive FROM product_variants WHERE id = ? AND productId = ?', [variantId, productId]);
        return rows[0] ? { ...rows[0], isActive: toBool(rows[0].isActive) } : null;
    }
    async adjustStock(productId, variantId, delta) {
        const result = await this.dataSource.query(`UPDATE product_variants SET stock = CAST(stock AS SIGNED) + ?, version = version + 1
       WHERE id = ? AND productId = ? AND CAST(stock AS SIGNED) + ? >= 0`, [delta, variantId, productId, delta]);
        return result.affectedRows > 0;
    }
    async setStock(productId, variantId, stock) {
        const result = await this.dataSource.query('UPDATE product_variants SET stock = ?, version = version + 1 WHERE id = ? AND productId = ?', [stock, variantId, productId]);
        return result.affectedRows > 0;
    }
    async existsIn(table, id) {
        const rows = await this.dataSource.query(`SELECT 1 FROM ${table} WHERE id = ? LIMIT 1`, [id]);
        return rows.length > 0;
    }
    async insertGemstones(manager, productId, gemstones) {
        if (!gemstones.length)
            return;
        await manager.save(ProductGemstone, gemstones.map((item) => manager.create(ProductGemstone, { ...item, productId })));
    }
    async insertVariants(manager, productId, variants) {
        if (!variants.length)
            return;
        await manager.save(ProductVariant, variants.map((item) => manager.create(ProductVariant, { ...item, productId })));
    }
    async sumStockByProduct(productIds) {
        const result = new Map();
        if (!productIds.length)
            return result;
        const rows = await this.dataSource.query('SELECT productId, SUM(stock) AS total FROM product_variants WHERE productId IN (?) GROUP BY productId', [productIds]);
        for (const row of rows)
            result.set(row.productId, Number(row.total));
        return result;
    }
    async primaryImageUrlByProduct(productIds) {
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
};
ProductAdminRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], ProductAdminRepository);
export { ProductAdminRepository };
//# sourceMappingURL=product-admin.repository.js.map