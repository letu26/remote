export declare const MENU_PLACEMENTS: readonly ["header", "footer"];
export type MenuPlacement = (typeof MENU_PLACEMENTS)[number];
export declare class MenuQueryDto {
    placement?: MenuPlacement;
}
export declare class CreateMenuDto {
    label: string;
    url: string;
    parentId?: number | null;
    placement?: MenuPlacement;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class UpdateMenuDto {
    label?: string;
    url?: string;
    parentId?: number | null;
    placement?: MenuPlacement;
    sortOrder?: number;
    isActive?: boolean;
}
