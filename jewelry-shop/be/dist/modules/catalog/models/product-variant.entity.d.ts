import { BaseEntity } from '../../../models/base.entity.js';
export declare class ProductVariant extends BaseEntity {
    productId: number;
    sku: string;
    size: string;
    stock: number;
    isActive: boolean;
    version: number;
}
