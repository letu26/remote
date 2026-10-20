import { BaseEntity } from '../../../models/base.entity.js';
export declare class OrderItem extends BaseEntity {
    orderId: number;
    variantId: number;
    productName: string;
    productCode: string;
    imageUrl: string | null;
    size: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}
