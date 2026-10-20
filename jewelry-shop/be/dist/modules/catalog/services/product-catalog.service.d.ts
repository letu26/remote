import { type Page } from '../../../utils/pagination.js';
import type { ProductListQueryDto } from '../dtos/product-query.dto.js';
import type { CategoryRef, ProductListRow } from '../models/catalog.types.js';
import { TargetGroup } from '../models/product.entity.js';
import { ProductQueryRepository } from '../repositories/product-query.repository.js';
import { type CategoryIndex, CatalogService } from './catalog.service.js';
export interface ProductListItem {
    id: number;
    code: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    discountPercent: number | null;
    primaryImageUrl: string | null;
    inStock: boolean;
    avgRating: number;
    reviewCount: number;
    isFeatured: boolean;
    targetGroup: TargetGroup;
    category: CategoryRef;
}
export declare function computeSalePrice(price: number, discountPercent: number | null): number | null;
export declare class ProductCatalogService {
    private readonly products;
    private readonly catalog;
    constructor(products: ProductQueryRepository, catalog: CatalogService);
    list(query: ProductListQueryDto): Promise<Page<ProductListItem>>;
    getBySlug(slug: string): Promise<{
        salePrice: number | null;
        inStock: boolean;
        category: CategoryRef;
        breadcrumb: CategoryRef[];
        material: {
            id: number;
            name: string;
        } | null;
        collection: {
            id: number;
            name: string;
            slug: string;
        } | null;
        images: import("../models/catalog.types.js").ImageRow[];
        variants: {
            id: number;
            sku: string;
            size: string;
            stock: number;
        }[];
        gemstones: import("../models/catalog.types.js").GemstoneRow[];
        related: ProductListItem[];
        id: number;
        code: string;
        name: string;
        slug: string;
        description: string | null;
        price: number;
        discountPercent: number | null;
        targetGroup: TargetGroup;
        weight: number | null;
        warrantyInfo: string | null;
        certificate: string | null;
        isFeatured: boolean;
        avgRating: number;
        reviewCount: number;
        soldCount: number;
    }>;
    private findRelated;
    toItems(rows: ProductListRow[], categories: CategoryIndex): ProductListItem[];
}
