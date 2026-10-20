import { DataSource } from 'typeorm';
import { type TargetGroup } from '../../catalog/models/product.entity.js';
export interface AdminProductListRow {
    id: number;
    code: string;
    name: string;
    slug: string;
    price: number;
    categoryId: number;
    categoryName: string;
    isActive: boolean;
    isFeatured: boolean;
    totalStock: number;
    primaryImageUrl: string | null;
    createdAt: Date;
}
export interface AdminProductFilter {
    q?: string;
    categoryId?: number;
    isActive?: boolean;
}
export interface ProductScalarWrite {
    code?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    categoryId?: number;
    materialId?: number | null;
    collectionId?: number | null;
    targetGroup?: TargetGroup;
    weight?: number | null;
    costPrice?: number;
    price?: number;
    warrantyInfo?: string | null;
    certificate?: string | null;
    isFeatured?: boolean;
    isActive?: boolean;
}
export interface GemstoneWrite {
    gemstoneId: number;
    quantity: number;
    carat: number | null;
    color: string | null;
    clarity: string | null;
    cut: string | null;
}
export interface NewVariantWrite {
    sku: string;
    size: string;
    stock: number;
    isActive: boolean;
}
export interface VariantSyncPlan {
    update: {
        id: number;
        sku: string;
        size: string;
        isActive?: boolean;
    }[];
    create: NewVariantWrite[];
    deactivateIds: number[];
}
export interface AdminVariantRow {
    id: number;
    sku: string;
    size: string;
    stock: number;
    isActive: boolean;
}
export interface AdminImageRow {
    id: number;
    url: string;
    publicId: string | null;
    isPrimary: boolean;
    sortOrder: number;
}
export interface AdminGemstoneRow {
    id: number;
    gemstoneId: number;
    name: string;
    quantity: number;
    carat: number | null;
    color: string | null;
    clarity: string | null;
    cut: string | null;
}
export interface AdminProductRow {
    id: number;
    code: string;
    name: string;
    slug: string;
    description: string | null;
    categoryId: number;
    categoryName: string;
    materialId: number | null;
    collectionId: number | null;
    targetGroup: TargetGroup;
    weight: number | null;
    costPrice: number;
    price: number;
    warrantyInfo: string | null;
    certificate: string | null;
    isFeatured: boolean;
    isActive: boolean;
    soldCount: number;
    avgRating: number;
    reviewCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ProductAdminRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findPage(filter: AdminProductFilter, limit: number, offset: number): Promise<{
        rows: AdminProductListRow[];
        total: number;
    }>;
    findById(id: number): Promise<AdminProductRow | null>;
    exists(id: number): Promise<boolean>;
    findSlugsStartingWith(prefix: string): Promise<string[]>;
    findVariants(productId: number): Promise<AdminVariantRow[]>;
    findImages(productId: number): Promise<AdminImageRow[]>;
    findGemstones(productId: number): Promise<AdminGemstoneRow[]>;
    categoryExists(id: number): Promise<boolean>;
    materialExists(id: number): Promise<boolean>;
    collectionExists(id: number): Promise<boolean>;
    findExistingGemstoneIds(ids: number[]): Promise<Set<number>>;
    hasOrderItems(productId: number): Promise<boolean>;
    create(scalars: Required<Pick<ProductScalarWrite, 'code' | 'name' | 'slug' | 'categoryId' | 'price'>> & ProductScalarWrite, gemstones: GemstoneWrite[], variants: NewVariantWrite[]): Promise<number>;
    update(id: number, scalars: ProductScalarWrite, gemstones: GemstoneWrite[] | undefined, variantPlan: VariantSyncPlan | undefined): Promise<void>;
    remove(id: number): Promise<string[]>;
    findVariant(productId: number, variantId: number): Promise<AdminVariantRow | null>;
    adjustStock(productId: number, variantId: number, delta: number): Promise<boolean>;
    setStock(productId: number, variantId: number, stock: number): Promise<boolean>;
    private existsIn;
    private insertGemstones;
    private insertVariants;
    private sumStockByProduct;
    private primaryImageUrlByProduct;
}
