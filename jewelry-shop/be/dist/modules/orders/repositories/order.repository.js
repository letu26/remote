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
import { generateOrderCode } from '../../../utils/order-code.util.js';
import { OrderStatus } from '../models/order.enums.js';
export class StockShortageError extends Error {
    shortages;
    constructor(shortages) {
        super('Insufficient stock');
        this.shortages = shortages;
    }
}
export class CartChangedError extends Error {
    constructor() {
        super('Cart changed');
    }
}
const MAX_CODE_ATTEMPTS = 5;
let OrderRepository = class OrderRepository {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    createOrder(input) {
        return this.dataSource.transaction(async (manager) => {
            await this.lockAndVerifyCartLines(manager, input);
            const shortages = [];
            const ordered = [...input.lines].sort((a, b) => a.variantId - b.variantId);
            for (const line of ordered) {
                const result = await manager.query('UPDATE product_variants SET stock = stock - ?, version = version + 1 WHERE id = ? AND isActive = 1 AND stock >= ?', [line.quantity, line.variantId, line.quantity]);
                if (result.affectedRows === 0) {
                    const rows = await manager.query('SELECT stock FROM product_variants WHERE id = ?', [line.variantId]);
                    shortages.push({
                        variantId: line.variantId,
                        productName: line.productName,
                        size: line.size,
                        available: rows[0]?.stock ?? 0,
                        requested: line.quantity,
                    });
                }
            }
            if (shortages.length)
                throw new StockShortageError(shortages);
            const { id, code } = await this.insertOrder(manager, input);
            await manager.query(`INSERT INTO order_items (orderId, variantId, productName, productCode, imageUrl, size, unitPrice, quantity, lineTotal)
         VALUES ?`, [
                input.lines.map((line) => [
                    id,
                    line.variantId,
                    line.productName,
                    line.productCode,
                    line.imageUrl,
                    line.size,
                    line.unitPrice,
                    line.quantity,
                    line.lineTotal,
                ]),
            ]);
            await manager.query('INSERT INTO order_status_history (orderId, status, changedById, note) VALUES (?, ?, ?, ?)', [
                id,
                OrderStatus.PENDING,
                input.userId,
                'Đặt hàng',
            ]);
            await manager.query('DELETE FROM cart_items WHERE id IN (?)', [input.lines.map((line) => line.cartItemId)]);
            return { id, code };
        });
    }
    withLockedOrder(where, work) {
        return this.dataSource.transaction(async (manager) => {
            const [clause, params] = 'id' in where ? ['id = ?', [where.id]] : ['code = ? AND userId = ?', [where.code, where.userId]];
            const rows = await manager.query(`SELECT id, code, userId, status, paymentMethod, paymentStatus FROM orders WHERE ${clause} FOR UPDATE`, params);
            if (!rows.length)
                return null;
            return work(this.createTransaction(manager, rows[0]));
        });
    }
    async lockAndVerifyCartLines(manager, input) {
        const rows = await manager.query(`SELECT ci.id, ci.quantity FROM cart_items ci JOIN carts c ON c.id = ci.cartId
       WHERE c.userId = ? AND ci.id IN (?) FOR UPDATE`, [input.userId, input.lines.map((line) => line.cartItemId)]);
        const quantityById = new Map(rows.map((row) => [row.id, row.quantity]));
        if (input.lines.some((line) => quantityById.get(line.cartItemId) !== line.quantity))
            throw new CartChangedError();
    }
    async insertOrder(manager, input) {
        for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
            const code = generateOrderCode();
            try {
                const result = await manager.query(`INSERT INTO orders (code, userId, receiverName, receiverPhone, provinceName, wardName, addressDetail, note,
                               shippingMethodId, shippingMethodName, subtotal, shippingFee, total, paymentMethod,
                               paymentStatus, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending')`, [
                    code,
                    input.userId,
                    input.receiverName,
                    input.receiverPhone,
                    input.provinceName,
                    input.wardName,
                    input.addressDetail,
                    input.note,
                    input.shippingMethodId,
                    input.shippingMethodName,
                    input.subtotal,
                    input.shippingFee,
                    input.total,
                    input.paymentMethod,
                ]);
                return { id: result.insertId, code };
            }
            catch (error) {
                if (getDuplicateInfo(error)?.table !== 'orders' || attempt === MAX_CODE_ATTEMPTS - 1)
                    throw error;
            }
        }
        throw new Error('Không sinh được mã đơn');
    }
    createTransaction(manager, order) {
        return {
            order,
            update: async (fields) => {
                const sets = [];
                const params = [];
                if (fields.status !== undefined) {
                    sets.push('status = ?');
                    params.push(fields.status);
                }
                if (fields.cancelReason !== undefined) {
                    sets.push('cancelReason = ?');
                    params.push(fields.cancelReason);
                }
                if (fields.paymentStatus !== undefined) {
                    sets.push('paymentStatus = ?');
                    params.push(fields.paymentStatus);
                }
                if (fields.paidAt !== undefined) {
                    sets.push('paidAt = ?');
                    params.push(fields.paidAt);
                }
                if (!sets.length)
                    return;
                await manager.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, [...params, order.id]);
            },
            addHistory: async (status, changedById, note) => {
                await manager.query('INSERT INTO order_status_history (orderId, status, changedById, note) VALUES (?, ?, ?, ?)', [
                    order.id,
                    status,
                    changedById,
                    note,
                ]);
            },
            restockItems: async () => {
                await manager.query(`UPDATE product_variants v
           JOIN (SELECT variantId, SUM(quantity) AS qty FROM order_items WHERE orderId = ? GROUP BY variantId) t
             ON t.variantId = v.id
           SET v.stock = v.stock + t.qty, v.version = v.version + 1`, [order.id]);
            },
            increaseSoldCount: async () => {
                await manager.query(`UPDATE products p
           JOIN (SELECT v.productId, SUM(oi.quantity) AS qty
                 FROM order_items oi JOIN product_variants v ON v.id = oi.variantId
                 WHERE oi.orderId = ? GROUP BY v.productId) t ON t.productId = p.id
           SET p.soldCount = p.soldCount + t.qty`, [order.id]);
            },
        };
    }
};
OrderRepository = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource])
], OrderRepository);
export { OrderRepository };
//# sourceMappingURL=order.repository.js.map