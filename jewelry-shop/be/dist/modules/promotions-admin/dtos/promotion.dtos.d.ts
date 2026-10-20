import { PageQueryDto } from '../../../utils/pagination.js';
import { type PromotionStatus } from '../services/promotion-status.js';
export declare class PromotionListQueryDto extends PageQueryDto {
    q?: string;
    status?: PromotionStatus;
    productId?: number;
}
export declare class CreatePromotionDto {
    name: string;
    productIds: number[];
    discountPercent: number;
    startsAt: string;
    endsAt: string;
    isActive?: boolean;
}
export declare class UpdatePromotionDto {
    name?: string;
    discountPercent?: number;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
}
