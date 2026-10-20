import { BaseEntity } from '../../../models/base.entity.js';
export declare class ProductGemstone extends BaseEntity {
    productId: number;
    gemstoneId: number;
    quantity: number;
    carat: number | null;
    color: string | null;
    clarity: string | null;
    cut: string | null;
}
