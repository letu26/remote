export type PromotionStatus = 'disabled' | 'upcoming' | 'expired' | 'active';

export const PROMOTION_STATUSES: readonly PromotionStatus[] = ['active', 'upcoming', 'expired', 'disabled'];

/** Thứ tự ưu tiên: disabled, rồi expired, rồi upcoming, còn lại active. Phải khớp điều kiện SQL ở repository. */
export function computePromotionStatus(
  promotion: { isActive: boolean; startsAt: Date; endsAt: Date },
  now: Date,
): PromotionStatus {
  if (!promotion.isActive) return 'disabled';
  if (promotion.endsAt.getTime() < now.getTime()) return 'expired';
  if (promotion.startsAt.getTime() > now.getTime()) return 'upcoming';
  return 'active';
}
