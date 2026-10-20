import { BaseEntity } from '../../../models/base.entity.js';
export declare class Review extends BaseEntity {
    userId: number;
    productId: number;
    orderItemId: number;
    rating: number;
    comment: string | null;
    isHidden: boolean;
}
