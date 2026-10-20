import { BaseEntity } from '../../../models/base.entity.js';
export declare class Promotion extends BaseEntity {
    name: string;
    productId: number;
    discountPercent: number;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
}
