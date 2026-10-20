var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { computeSalePrice } from '../../catalog/services/product-catalog.service.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import { MAX_LINE_QUANTITY } from '../dtos/cart.dtos.js';
import { CartRepository } from '../repositories/cart.repository.js';
export function detectIssue(line, categoryVisible) {
    if (!line.variantActive || !line.productActive || !categoryVisible)
        return 'UNAVAILABLE';
    if (line.stock <= 0)
        return 'OUT_OF_STOCK';
    if (line.stock < line.quantity)
        return 'INSUFFICIENT_STOCK';
    return null;
}
let CartService = class CartService {
    cart;
    catalog;
    constructor(cart, catalog) {
        this.cart = cart;
        this.catalog = catalog;
    }
    async getCart(userId) {
        const [lines, tree] = await Promise.all([this.cart.findLines(userId, new Date()), this.catalog.getCategoryTree()]);
        const visibleCategories = this.catalog.flattenTree(tree);
        const items = lines.map((line) => {
            const salePrice = computeSalePrice(line.price, line.discountPercent);
            const unitPrice = salePrice ?? line.price;
            const issue = detectIssue(line, visibleCategories.has(line.categoryId));
            return {
                id: line.id,
                variantId: line.variantId,
                productId: line.productId,
                productCode: line.productCode,
                productName: line.productName,
                productSlug: line.productSlug,
                size: line.size,
                imageUrl: line.imageUrl,
                price: line.price,
                salePrice,
                discountPercent: line.discountPercent,
                unitPrice,
                quantity: line.quantity,
                lineTotal: unitPrice * line.quantity,
                stock: line.stock,
                available: issue === null,
                issue,
            };
        });
        return {
            items,
            subtotal: items.filter((item) => item.issue === null).reduce((sum, item) => sum + item.lineTotal, 0),
            itemCount: items.length,
            totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
            hasIssues: items.some((item) => item.issue !== null),
        };
    }
    summary(userId) {
        return this.cart.summary(userId);
    }
    async addItem(userId, variantId, quantity = 1) {
        const visible = this.catalog.flattenTree(await this.catalog.getCategoryTree());
        await this.cart.runInCart(userId, async (tx) => {
            const state = await tx.findVariantState(variantId);
            this.assertSellable(state, visible);
            const existing = await tx.findItemByVariant(variantId);
            const inCart = existing?.quantity ?? 0;
            const total = inCart + quantity;
            if (total > MAX_LINE_QUANTITY)
                throw this.limitExceeded(inCart);
            if (total > state.stock)
                throw this.insufficient(state.stock, inCart);
            await tx.addQuantity(variantId, quantity, MAX_LINE_QUANTITY);
        });
        return this.getCart(userId);
    }
    async setQuantity(userId, itemId, quantity) {
        const visible = this.catalog.flattenTree(await this.catalog.getCategoryTree());
        await this.cart.runInCart(userId, async (tx) => {
            const item = await tx.findItemById(itemId);
            if (!item)
                throw this.itemNotFound();
            const state = await tx.findVariantState(item.variantId);
            this.assertSellable(state, visible);
            if (quantity > state.stock)
                throw this.insufficient(state.stock, item.quantity);
            await tx.setQuantity(itemId, quantity);
        });
        return this.getCart(userId);
    }
    async removeItem(userId, itemId) {
        if ((await this.cart.removeItems(userId, [itemId])) === 0)
            throw this.itemNotFound();
        return this.getCart(userId);
    }
    async removeItems(userId, itemIds) {
        await this.cart.removeItems(userId, [...new Set(itemIds)]);
        return this.getCart(userId);
    }
    clear(userId) {
        return this.cart.clear(userId);
    }
    assertSellable(state, visibleCategories) {
        if (!state)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm hoặc biến thể', HttpStatus.NOT_FOUND);
        if (!state.variantActive || !state.productActive || !visibleCategories.has(state.categoryId)) {
            throw new BusinessException(ErrorCode.ITEM_UNAVAILABLE, 'Sản phẩm này đã ngừng bán, không thể thêm vào giỏ', HttpStatus.CONFLICT);
        }
    }
    limitExceeded(inCart) {
        return new BusinessException(ErrorCode.QUANTITY_LIMIT_EXCEEDED, `Mỗi sản phẩm chỉ mua tối đa ${MAX_LINE_QUANTITY} cái (trong giỏ đang có ${inCart})`, HttpStatus.BAD_REQUEST);
    }
    insufficient(available, inCart) {
        return new BusinessException(ErrorCode.INSUFFICIENT_STOCK, `Chỉ còn ${available} sản phẩm trong kho (trong giỏ đang có ${inCart})`, HttpStatus.CONFLICT, { available, inCart });
    }
    itemNotFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy mục trong giỏ hàng', HttpStatus.NOT_FOUND);
    }
};
CartService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CartRepository,
        CatalogService])
], CartService);
export { CartService };
//# sourceMappingURL=cart.service.js.map