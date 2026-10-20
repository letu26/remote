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
import { CartRepository } from '../../cart/repositories/cart.repository.js';
import { detectIssue } from '../../cart/services/cart.service.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import { computeSalePrice } from '../../catalog/services/product-catalog.service.js';
import { ShippingMethodRepository } from '../../shipping-methods/repositories/shipping-method.repository.js';
let OrderPricingService = class OrderPricingService {
    cart;
    catalog;
    shippingMethods;
    constructor(cart, catalog, shippingMethods) {
        this.cart = cart;
        this.catalog = catalog;
        this.shippingMethods = shippingMethods;
    }
    async compute(userId, itemIds, shippingMethodId, requireShipping) {
        const wanted = new Set(itemIds);
        const [cartLines, tree, shipping] = await Promise.all([
            this.cart.findLines(userId, new Date()),
            this.catalog.getCategoryTree(),
            this.resolveShipping(shippingMethodId, requireShipping),
        ]);
        const visibleCategories = this.catalog.flattenTree(tree);
        const lines = cartLines
            .filter((line) => wanted.has(line.id))
            .map((line) => {
            const unitPrice = computeSalePrice(line.price, line.discountPercent) ?? line.price;
            return {
                cartItemId: line.id,
                variantId: line.variantId,
                productId: line.productId,
                productName: line.productName,
                productSlug: line.productSlug,
                productCode: line.productCode,
                size: line.size,
                imageUrl: line.imageUrl,
                unitPrice,
                quantity: line.quantity,
                lineTotal: unitPrice * line.quantity,
                stock: line.stock,
                issue: detectIssue(line, visibleCategories.has(line.categoryId)),
            };
        });
        if (!lines.length) {
            throw new BusinessException(ErrorCode.EMPTY_ORDER, 'Chưa chọn sản phẩm hợp lệ nào trong giỏ hàng', HttpStatus.BAD_REQUEST);
        }
        const subtotal = lines.filter((line) => line.issue === null).reduce((sum, line) => sum + line.lineTotal, 0);
        const shippingFee = shipping?.fee ?? 0;
        return {
            lines,
            subtotal,
            shippingFee,
            total: subtotal + shippingFee,
            shippingMethod: shipping ? { id: shipping.id, name: shipping.name } : null,
        };
    }
    async resolveShipping(id, required) {
        if (id === undefined) {
            if (required)
                throw this.shippingUnavailable();
            return null;
        }
        const method = await this.shippingMethods.findById(id);
        if (!method || !method.isActive)
            throw this.shippingUnavailable();
        return method;
    }
    shippingUnavailable() {
        return new BusinessException(ErrorCode.SHIPPING_METHOD_UNAVAILABLE, 'Phương thức vận chuyển không tồn tại hoặc đã tắt', HttpStatus.BAD_REQUEST);
    }
};
OrderPricingService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CartRepository,
        CatalogService,
        ShippingMethodRepository])
], OrderPricingService);
export { OrderPricingService };
//# sourceMappingURL=order-pricing.service.js.map