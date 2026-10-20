import type { AdminPromotion, PromotionCreateInput, PromotionStatus, PromotionUpdateInput } from "@/types/admin-promotion";
import type { FormErrors } from "@/utils/validators";
import { fromLocalInputValue, toLocalInputValue } from "../dashboard/date-utils";

export const MAX_PRODUCTS = 100;

export const PROMOTION_STATUS_LABEL: Record<PromotionStatus, string> = {
  active: "Đang chạy",
  upcoming: "Sắp tới",
  expired: "Đã hết hạn",
  disabled: "Đã tắt",
};
export const PROMOTION_STATUS_TONE: Record<PromotionStatus, string> = {
  active: "bg-success/10 text-success border border-success/30",
  upcoming: "bg-gold-tint text-gold-deeper border border-gold/50",
  expired: "bg-sand text-muted border border-line-strong",
  disabled: "bg-sale/10 text-sale border border-sale/30",
};
export const PROMOTION_STATUSES = Object.keys(PROMOTION_STATUS_LABEL) as PromotionStatus[];

export interface PickedProduct {
  id: number;
  code: string;
  name: string;
  price: number;
}

export interface PromotionFormValues {
  name: string;
  products: PickedProduct[];
  discountPercent: string;
  startsAt: string; // datetime-local
  endsAt: string;
  isActive: boolean;
}

export const emptyPromotionForm = (): PromotionFormValues => ({
  name: "",
  products: [],
  discountPercent: "10",
  startsAt: "",
  endsAt: "",
  isActive: true,
});

export const promotionToForm = (p: AdminPromotion, price = 0): PromotionFormValues => ({
  name: p.name,
  products: [{ id: p.productId, code: p.productCode, name: p.productName, price }],
  discountPercent: String(p.discountPercent),
  startsAt: toLocalInputValue(p.startsAt),
  endsAt: toLocalInputValue(p.endsAt),
  isActive: p.isActive,
});

export function validatePromotionForm(v: PromotionFormValues, mode: "create" | "edit"): FormErrors {
  const e: FormErrors = {};
  const name = v.name.trim();
  if (name.length < 1 || name.length > 150) e.name = "Tên khuyến mại từ 1 đến 150 ký tự";
  if (mode === "create") {
    if (v.products.length < 1) e.productIds = "Vui lòng chọn ít nhất 1 sản phẩm";
    else if (v.products.length > MAX_PRODUCTS) e.productIds = `Tối đa ${MAX_PRODUCTS} sản phẩm`;
  }
  const pct = v.discountPercent.trim();
  if (!/^\d+$/.test(pct) || Number(pct) < 1 || Number(pct) > 90) e.discountPercent = "Phần trăm giảm là số nguyên từ 1 đến 90";
  const s = fromLocalInputValue(v.startsAt);
  const en = fromLocalInputValue(v.endsAt);
  if (!s) e.startsAt = "Vui lòng chọn thời gian bắt đầu";
  if (!en) e.endsAt = "Vui lòng chọn thời gian kết thúc";
  if (s && en && new Date(s).getTime() >= new Date(en).getTime()) e.endsAt = "Thời gian kết thúc phải sau thời gian bắt đầu";
  return e;
}

export function toCreateInput(v: PromotionFormValues): PromotionCreateInput {
  return {
    name: v.name.trim(),
    productIds: v.products.map((p) => p.id),
    discountPercent: Number(v.discountPercent),
    startsAt: fromLocalInputValue(v.startsAt) as string,
    endsAt: fromLocalInputValue(v.endsAt) as string,
    isActive: v.isActive,
  };
}
export function toUpdateInput(v: PromotionFormValues): PromotionUpdateInput {
  const { productIds: _ids, ...rest } = toCreateInput(v);
  void _ids;
  return rest;
}

/** Giá sau giảm (chỉ minh họa): round(price * (100 - percent) / 100). */
export function previewPrice(price: number, percent: number): number {
  return Math.round((price * (100 - percent)) / 100);
}

/**
 * Khuyến mại khác (đang bật, chưa hết hạn) của cùng sản phẩm có khoảng thời gian trùng với [startsAt, endsAt].
 * Chỉ dựa trên dữ liệu đã tải nên có thể chưa đầy đủ.
 */
export function findOverlaps(
  promotions: AdminPromotion[],
  productIds: number[],
  startsAtIso: string | null,
  endsAtIso: string | null,
  ignoreId?: number,
): AdminPromotion[] {
  if (!startsAtIso || !endsAtIso) return [];
  const s = new Date(startsAtIso).getTime();
  const e = new Date(endsAtIso).getTime();
  return promotions.filter(
    (p) =>
      p.id !== ignoreId &&
      p.isActive &&
      p.status !== "expired" &&
      productIds.includes(p.productId) &&
      new Date(p.startsAt).getTime() <= e &&
      new Date(p.endsAt).getTime() >= s,
  );
}
