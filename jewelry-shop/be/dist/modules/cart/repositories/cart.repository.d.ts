import { DataSource } from 'typeorm';
import { ProductQueryRepository } from '../../catalog/repositories/product-query.repository.js';
export interface CartLineRow {
    id: number;
    variantId: number;
    quantity: number;
    size: string;
    stock: number;
    variantActive: boolean;
    productId: number;
    productCode: string;
    productName: string;
    productSlug: string;
    price: number;
    productActive: boolean;
    categoryId: number;
    discountPercent: number | null;
    imageUrl: string | null;
}
export interface VariantState {
    categoryId: number;
    stock: number;
    variantActive: boolean;
    productActive: boolean;
}
export interface CartItemRef {
    id: number;
    variantId: number;
    quantity: number;
}
export interface CartTransaction {
    findVariantState(variantId: number): Promise<VariantState | null>;
    findItemByVariant(variantId: number): Promise<CartItemRef | null>;
    findItemById(itemId: number): Promise<CartItemRef | null>;
    addQuantity(variantId: number, quantity: number, maxQuantity: number): Promise<void>;
    setQuantity(itemId: number, quantity: number): Promise<void>;
}
export declare class CartRepository {
    private readonly dataSource;
    private readonly productQueries;
    constructor(dataSource: DataSource, productQueries: ProductQueryRepository);
    findLines(userId: number, now: Date): Promise<CartLineRow[]>;
    summary(userId: number): Promise<{
        itemCount: number;
        totalQuantity: number;
    }>;
    runInCart<T>(userId: number, work: (tx: CartTransaction) => Promise<T>): Promise<T>;
    removeItems(userId: number, itemIds: number[]): Promise<number>;
    clear(userId: number): Promise<void>;
    private createTransaction;
}
