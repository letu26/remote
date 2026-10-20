import { BaseEntity } from '../../../models/base.entity.js';
export declare class ProductImage extends BaseEntity {
    productId: number;
    url: string;
    publicId: string | null;
    sortOrder: number;
    isPrimary: boolean;
}
