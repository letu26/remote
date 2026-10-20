import { BaseEntity } from '../../../models/base.entity.js';
export declare class CartItem extends BaseEntity {
    cartId: number;
    variantId: number;
    quantity: number;
}
