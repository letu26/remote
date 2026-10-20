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
import { ACTIVE_PROMOTION_JOIN, ProductQueryRepository } from '../../catalog/repositories/product-query.repository.js';
let CartRepository = class CartRepository {
    dataSource;
    productQueries;
    constructor(dataSource, productQueries) {
        this.dataSource = dataSource;
        this.productQueries = productQueries;
    }
    async findLines(userId, now) {
        const rows = await this.dataSource.query(`SELECT ci.id, ci.variantId, ci.quantity, v.size, v.stock, v.isActive AS variantActive,
              p.id AS productId, p.code AS productCode, p.name AS productName, p.slug AS productSlug,
              p.price, p.isActive AS productActive, p.categoryId, pr.discountPercent
       FROM carts c
       JOIN cart_items ci ON ci.cartId = c.id
       JOIN product_variants v ON v.id = ci.variantId
       JOIN products p ON p.id = v.productId
       ${ACTIVE_PROMOTION_JOIN}
       WHERE c.userId = ?
       ORDER BY ci.createdAt DESC, ci.id DESC`, [now, now, userId]);
        const images = await this.productQueries.findPrimaryImageUrls([...new Set(rows.map((row) => row.productId))]);
        return rows.map((row) => ({
            ...row,
            price: Number(row.price),
            variantActive: toBool(row.variantActive),
            productActive: toBool(row.productActive),
            imageUrl: images.get(row.productId) ?? null,
        }));
    }
    async summary(userId) {
        const rows = await this.dataSource.query(`SELECT COUNT(ci.id) AS itemCount, SUM(ci.quantity) AS totalQuantity
       FROM carts c JOIN cart_items ci ON ci.cartId = c.id WHERE c.userId = ?`, [userId]);
        return { itemCount: Number(rows[0]?.itemCount ?? 0), totalQuantity: Number(rows[0]?.totalQuantity ?? 0) };
    }
    runInCart(userId, work) {
        return this.dataSource.transaction(async (manager) => {
            const result = await manager.query('INSERT INTO carts (userId) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)', [userId]);
            const cartId = result.insertId;
            await manager.query('SELECT id FROM carts WHERE id = ? FOR UPDATE', [cartId]);
            return work(this.createTransaction(manager, cartId));
        });
    }
    async removeItems(userId, itemIds) {
        if (!itemIds.length)
            return 0;
        const result = await this.dataSource.query(`DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cartId WHERE c.userId = ? AND ci.id IN (?)`, [userId, itemIds]);
        return result.affectedRows;
    }
    async clear(userId) {
        await this.dataSource.query('DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cartId WHERE c.userId = ?', [userId]);
    }
    createTransaction(manager, cartId) {
        return {
            findVariantState: async (variantId) => {
                const rows = await manager.query(`SELECT v.stock, v.isActive AS variantActive, p.isActive AS productActive, p.categoryId
           FROM product_variants v JOIN products p ON p.id = v.productId WHERE v.id = ?`, [variantId]);
                return rows[0]
                    ? { categoryId: rows[0].categoryId, stock: rows[0].stock, variantActive: toBool(rows[0].variantActive), productActive: toBool(rows[0].productActive) }
                    : null;
            },
            findItemByVariant: async (variantId) => {
                const rows = await manager.query('SELECT id, variantId, quantity FROM cart_items WHERE cartId = ? AND variantId = ?', [cartId, variantId]);
                return rows[0] ?? null;
            },
            findItemById: async (itemId) => {
                const rows = await manager.query('SELECT id, variantId, quantity FROM cart_items WHERE cartId = ? AND id = ?', [cartId, itemId]);
                return rows[0] ?? null;
            },
            addQuantity: async (variantId, quantity, maxQuantity) => {
                await manager.query(`INSERT INTO cart_items (cartId, variantId, quantity) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE quantity = IF(quantity + VALUES(quantity) <= ?, quantity + VALUES(quantity), quantity)`, [cartId, variantId, quantity, maxQuantity]);
            },
            setQuantity: async (itemId, quantity) => {
                await manager.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND cartId = ?', [quantity, itemId, cartId]);
            },
        };
    }
};
CartRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource,
        ProductQueryRepository])
], CartRepository);
export { CartRepository };
//# sourceMappingURL=cart.repository.js.map