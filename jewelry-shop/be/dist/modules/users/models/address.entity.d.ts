import { BaseEntity } from '../../../models/base.entity.js';
export declare class Address extends BaseEntity {
    userId: number;
    receiverName: string;
    receiverPhone: string;
    provinceId: number;
    wardId: number;
    detail: string;
    isDefault: boolean;
}
