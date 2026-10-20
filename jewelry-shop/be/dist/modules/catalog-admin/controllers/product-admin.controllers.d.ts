import { AdminProductListQueryDto, CreateProductDto, ReorderImagesDto, StockChangeDto, UpdateImageDto, UpdateProductDto } from '../dtos/product-admin.dtos.js';
import { ProductAdminService } from '../services/product-admin.service.js';
import { ProductImageService, type UploadedImageFile } from '../services/product-image.service.js';
export declare class ProductAdminController {
    private readonly service;
    constructor(service: ProductAdminService);
    list(query: AdminProductListQueryDto): Promise<import("../../../utils/pagination.js").Page<import("../repositories/product-admin.repository.js").AdminProductListRow>>;
    detail(id: number): Promise<{
        id: number;
        code: string;
        name: string;
        slug: string;
        description: string | null;
        categoryId: number;
        categoryName: string;
        materialId: number | null;
        collectionId: number | null;
        targetGroup: import("../../catalog/models/product.entity.js").TargetGroup;
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
        images: {
            id: number;
            url: string;
            isPrimary: boolean;
            sortOrder: number;
        }[];
        variants: import("../repositories/product-admin.repository.js").AdminVariantRow[];
        gemstones: import("../repositories/product-admin.repository.js").AdminGemstoneRow[];
    }>;
    create(dto: CreateProductDto): Promise<{
        id: number;
        code: string;
        name: string;
        slug: string;
        description: string | null;
        categoryId: number;
        categoryName: string;
        materialId: number | null;
        collectionId: number | null;
        targetGroup: import("../../catalog/models/product.entity.js").TargetGroup;
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
        images: {
            id: number;
            url: string;
            isPrimary: boolean;
            sortOrder: number;
        }[];
        variants: import("../repositories/product-admin.repository.js").AdminVariantRow[];
        gemstones: import("../repositories/product-admin.repository.js").AdminGemstoneRow[];
    }>;
    update(id: number, dto: UpdateProductDto): Promise<{
        id: number;
        code: string;
        name: string;
        slug: string;
        description: string | null;
        categoryId: number;
        categoryName: string;
        materialId: number | null;
        collectionId: number | null;
        targetGroup: import("../../catalog/models/product.entity.js").TargetGroup;
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
        images: {
            id: number;
            url: string;
            isPrimary: boolean;
            sortOrder: number;
        }[];
        variants: import("../repositories/product-admin.repository.js").AdminVariantRow[];
        gemstones: import("../repositories/product-admin.repository.js").AdminGemstoneRow[];
    }>;
    changeStock(id: number, variantId: number, dto: StockChangeDto): Promise<{
        id: number;
        sku: string;
        size: string;
        stock: number;
    }>;
    remove(id: number): Promise<void>;
}
export declare class ProductImageAdminController {
    private readonly service;
    constructor(service: ProductImageService);
    upload(id: number, files: UploadedImageFile[] | undefined): Promise<import("../services/product-image.service.js").ImageView[]>;
    reorder(id: number, dto: ReorderImagesDto): Promise<import("../services/product-image.service.js").ImageView[]>;
    update(id: number, imageId: number, dto: UpdateImageDto): Promise<import("../services/product-image.service.js").ImageView>;
    remove(id: number, imageId: number): Promise<void>;
}
