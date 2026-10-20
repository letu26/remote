export declare class CreateCategoryDto {
    name: string;
    slug?: string;
    parentId?: number | null;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class UpdateCategoryDto {
    name?: string;
    slug?: string;
    parentId?: number | null;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class CreateNamedLookupDto {
    name: string;
    isActive?: boolean;
}
export declare class UpdateNamedLookupDto {
    name?: string;
    isActive?: boolean;
}
export declare class CreateCollectionDto {
    name: string;
    slug?: string;
    description?: string | null;
    bannerUrl?: string | null;
    isActive?: boolean;
}
export declare class UpdateCollectionDto {
    name?: string;
    slug?: string;
    description?: string | null;
    bannerUrl?: string | null;
    isActive?: boolean;
}
