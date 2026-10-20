import { CatalogService } from '../../catalog/services/catalog.service.js';
import { type CartLineRow, CartRepository } from '../repositories/cart.repository.js';
export type CartIssue = 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK';
export interface CartItemView {
    id: number;
    variantId: number;
    productId: number;
    productCode: string;
    productName: string;
    productSlug: string;
    size: string;
    imageUrl: string | null;
    price: number;
    salePrice: number | null;
    discountPercent: number | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    stock: number;
    available: boolean;
    issue: CartIssue | null;
}
export interface CartView {
    items: CartItemView[];
    subtotal: number;
    itemCount: number;
    totalQuantity: number;
    hasIssues: boolean;
}
export declare function detectIssue(line: CartLineRow, categoryVisible: boolean): CartIssue | null;
export declare class CartService {
    private readonly cart;
    private readonly catalog;
    constructor(cart: CartRepository, catalog: CatalogService);
    getCart(userId: number): Promise<CartView>;
    summary(userId: number): Promise<{
        itemCount: number;
        totalQuantity: number;
    }>;
    addItem(userId: number, variantId: number, quantity?: number): Promise<CartView>;
    setQuantity(userId: number, itemId: number, quantity: number): Promise<CartView>;
    removeItem(userId: number, itemId: number): Promise<CartView>;
    removeItems(userId: number, itemIds: number[]): Promise<CartView>;
    clear(userId: number): Promise<void>;
    private assertSellable;
    private limitExceeded;
    private insufficient;
    private itemNotFound;
}
