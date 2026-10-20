import { DataSource } from 'typeorm';
export interface WishlistEntry {
    productId: number;
    addedAt: Date;
}
export declare class WishlistRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findActiveProductCategoryId(productId: number): Promise<number | null>;
    add(userId: number, productId: number): Promise<boolean>;
    remove(userId: number, productId: number): Promise<void>;
    findAllProductIds(userId: number): Promise<number[]>;
    findPage(userId: number, categoryIds: number[], limit: number, offset: number): Promise<{
        entries: WishlistEntry[];
        total: number;
    }>;
}
