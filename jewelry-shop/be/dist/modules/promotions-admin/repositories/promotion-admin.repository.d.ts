import { DataSource } from 'typeorm';
import type { PromotionStatus } from '../services/promotion-status.js';
export interface PromotionRow {
    id: number;
    name: string;
    productId: number;
    productCode: string;
    productName: string;
    discountPercent: number;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
    createdAt: Date;
}
export interface PromotionFilter {
    q?: string;
    status?: PromotionStatus;
    productId?: number;
}
export interface NewPromotion {
    name: string;
    productIds: number[];
    discountPercent: number;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
}
export interface PromotionWrite {
    name?: string;
    discountPercent?: number;
    startsAt?: Date;
    endsAt?: Date;
    isActive?: boolean;
}
export declare class PromotionAdminRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findPage(filter: PromotionFilter, limit: number, offset: number, now: Date): Promise<{
        rows: PromotionRow[];
        total: number;
    }>;
    findByIds(ids: number[]): Promise<PromotionRow[]>;
    findById(id: number): Promise<PromotionRow | null>;
    findExistingProductIds(ids: number[]): Promise<Set<number>>;
    create(data: NewPromotion): Promise<number[]>;
    update(id: number, data: PromotionWrite): Promise<void>;
    delete(id: number): Promise<void>;
}
