import { type Page } from '../../../utils/pagination.js';
import type { CreatePromotionDto, PromotionListQueryDto, UpdatePromotionDto } from '../dtos/promotion.dtos.js';
import { PromotionAdminRepository } from '../repositories/promotion-admin.repository.js';
export declare class PromotionAdminService {
    private readonly promotions;
    constructor(promotions: PromotionAdminRepository);
    list(query: PromotionListQueryDto): Promise<Page<unknown>>;
    create(dto: CreatePromotionDto): Promise<{
        created: number;
        items: {
            status: import("./promotion-status.js").PromotionStatus;
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
        }[];
    }>;
    update(id: number, dto: UpdatePromotionDto): Promise<{
        status: import("./promotion-status.js").PromotionStatus;
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
    }>;
    remove(id: number): Promise<void>;
    private toItem;
    private getOrFail;
}
