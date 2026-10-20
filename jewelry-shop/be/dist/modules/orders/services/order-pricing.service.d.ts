import { CartRepository } from '../../cart/repositories/cart.repository.js';
import { type CartIssue } from '../../cart/services/cart.service.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import { ShippingMethodRepository } from '../../shipping-methods/repositories/shipping-method.repository.js';
export interface PricedLine {
    cartItemId: number;
    variantId: number;
    productId: number;
    productName: string;
    productSlug: string;
    productCode: string;
    size: string;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    stock: number;
    issue: CartIssue | null;
}
export interface OrderPricing {
    lines: PricedLine[];
    subtotal: number;
    shippingFee: number;
    total: number;
    shippingMethod: {
        id: number;
        name: string;
    } | null;
}
export declare class OrderPricingService {
    private readonly cart;
    private readonly catalog;
    private readonly shippingMethods;
    constructor(cart: CartRepository, catalog: CatalogService, shippingMethods: ShippingMethodRepository);
    compute(userId: number, itemIds: number[], shippingMethodId: number | undefined, requireShipping: boolean): Promise<OrderPricing>;
    private resolveShipping;
    private shippingUnavailable;
}
