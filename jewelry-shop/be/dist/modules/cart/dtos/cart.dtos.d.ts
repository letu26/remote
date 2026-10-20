export declare const MAX_LINE_QUANTITY = 10;
export declare class AddCartItemDto {
    variantId: number;
    quantity?: number;
}
export declare class UpdateCartItemDto {
    quantity: number;
}
export declare class RemoveCartItemsDto {
    itemIds: number[];
}
