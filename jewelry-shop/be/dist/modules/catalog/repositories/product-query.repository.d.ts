import { DataSource } from 'typeorm';
import type { GemstoneRow, ImageRow, ProductDetailRow, ProductListFilter, ProductListRow, ProductSort, VariantRow } from '../models/catalog.types.js';
export declare const ACTIVE_PROMOTION_JOIN = "\n  LEFT JOIN (\n    SELECT productId, MAX(discountPercent) AS discountPercent\n    FROM promotions\n    WHERE isActive = 1 AND startsAt <= ? AND endsAt >= ?\n    GROUP BY productId\n  ) pr ON pr.productId = p.id";
export declare class ProductQueryRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    count(filter: ProductListFilter, now: Date): Promise<number>;
    findPage(filter: ProductListFilter, sort: ProductSort, limit: number, offset: number, now: Date): Promise<ProductListRow[]>;
    findActiveByIds(ids: number[], now: Date): Promise<ProductListRow[]>;
    private queryListRows;
    findActiveBySlug(slug: string, now: Date): Promise<ProductDetailRow | null>;
    findImages(productId: number): Promise<ImageRow[]>;
    findActiveVariants(productId: number): Promise<VariantRow[]>;
    findGemstones(productId: number): Promise<GemstoneRow[]>;
    private findVariantSummaries;
    findPrimaryImageUrls(productIds: number[]): Promise<Map<number, string>>;
    private buildWhere;
}
