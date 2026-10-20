import { BaseEntity } from '../../../models/base.entity.js';
export declare enum TargetGroup {
    MEN = "men",
    WOMEN = "women",
    UNISEX = "unisex",
    KIDS = "kids"
}
export declare class Product extends BaseEntity {
    code: string;
    name: string;
    slug: string;
    description: string | null;
    categoryId: number;
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
}
