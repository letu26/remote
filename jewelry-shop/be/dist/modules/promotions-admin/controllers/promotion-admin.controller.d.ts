import { CreatePromotionDto, PromotionListQueryDto, UpdatePromotionDto } from '../dtos/promotion.dtos.js';
import { PromotionAdminService } from '../services/promotion-admin.service.js';
export declare class PromotionAdminController {
    private readonly service;
    constructor(service: PromotionAdminService);
    list(query: PromotionListQueryDto): Promise<import("../../../utils/pagination.js").Page<unknown>>;
    create(dto: CreatePromotionDto): Promise<{
        created: number;
        items: {
            status: import("../services/promotion-status.js").PromotionStatus;
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
        status: import("../services/promotion-status.js").PromotionStatus;
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
}
