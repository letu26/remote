export const PROMOTION_STATUSES = ['active', 'upcoming', 'expired', 'disabled'];
export function computePromotionStatus(promotion, now) {
    if (!promotion.isActive)
        return 'disabled';
    if (promotion.endsAt.getTime() < now.getTime())
        return 'expired';
    if (promotion.startsAt.getTime() > now.getTime())
        return 'upcoming';
    return 'active';
}
//# sourceMappingURL=promotion-status.js.map