import { PageQueryDto } from '../../../utils/pagination.js';
import { TargetGroup } from '../../catalog/models/product.entity.js';
export declare class ProductGemstoneInputDto {
    gemstoneId: number;
    quantity?: number;
    carat?: number | null;
    color?: string | null;
    clarity?: string | null;
    cut?: string | null;
}
export declare class ProductVariantInputDto {
    id?: number;
    sku: string;
    size: string;
    stock?: number;
    isActive?: boolean;
}
export declare class CreateProductDto {
    code: string;
    name: string;
    slug?: string;
    description?: string | null;
    categoryId: number;
    materialId?: number | null;
    collectionId?: number | null;
    targetGroup?: TargetGroup;
    weight?: number | null;
    costPrice?: number;
    price: number;
    warrantyInfo?: string | null;
    certificate?: string | null;
    isFeatured?: boolean;
    isActive?: boolean;
    gemstones?: ProductGemstoneInputDto[];
    variants: ProductVariantInputDto[];
}
export declare class UpdateProductDto {
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
    gemstones?: ProductGemstoneInputDto[];
    variants?: ProductVariantInputDto[];
}
export declare class AdminProductListQueryDto extends PageQueryDto {
    q?: string;
    categoryId?: number;
    isActive?: boolean;
}
export declare class StockChangeDto {
    delta?: number;
    set?: number;
}
export declare class ReorderImagesDto {
    imageIds: number[];
}
export declare class UpdateImageDto {
    isPrimary?: boolean;
    sortOrder?: number;
}
