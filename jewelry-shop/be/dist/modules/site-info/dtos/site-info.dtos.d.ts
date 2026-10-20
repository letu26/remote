export declare class SiteInfoDto {
    brandName: string;
    slogan: string;
    hotline: string;
    email: string;
    address: string;
    openingHours: string;
    facebook: string;
    zalo: string;
    instagram: string;
    tiktok: string;
    footerText: string;
}
export type SiteInfo = {
    [K in keyof SiteInfoDto]: string;
};
export declare const SITE_INFO_DEFAULTS: SiteInfo;
export declare const SITE_INFO_FIELDS: (keyof SiteInfo)[];
