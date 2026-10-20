import { BaseEntity } from '../../../models/base.entity.js';
export declare class ShippingMethod extends BaseEntity {
    name: string;
    description: string | null;
    fee: number;
    isActive: boolean;
}
