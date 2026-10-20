export type PromotionStatus = 'disabled' | 'upcoming' | 'expired' | 'active';
export declare const PROMOTION_STATUSES: readonly PromotionStatus[];
export declare function computePromotionStatus(promotion: {
    isActive: boolean;
    startsAt: Date;
    endsAt: Date;
}, now: Date): PromotionStatus;
