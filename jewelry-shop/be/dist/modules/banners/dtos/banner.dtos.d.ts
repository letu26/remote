export declare const BANNER_POSITIONS: readonly ["home_hero", "home_promo"];
export type BannerPosition = (typeof BANNER_POSITIONS)[number];
export declare class BannerQueryDto {
    position?: BannerPosition;
}
export declare class CreateBannerDto {
    title: string;
    imageUrl: string;
    imagePublicId?: string | null;
    linkUrl?: string | null;
    position: BannerPosition;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class UpdateBannerDto {
    title?: string;
    imageUrl?: string;
    imagePublicId?: string | null;
    linkUrl?: string | null;
    position?: BannerPosition;
    sortOrder?: number;
    isActive?: boolean;
}
