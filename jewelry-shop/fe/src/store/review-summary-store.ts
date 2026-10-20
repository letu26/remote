"use client";

import { useSyncExternalStore } from "react";

/**
 * Điểm và số lượt đánh giá mới nhất của từng sản phẩm, để phần đầu trang chi tiết (render phía server)
 * cập nhật ngay sau khi khách tạo/sửa/xóa đánh giá mà không phải tải lại trang.
 */
export interface RatingOverride {
  avgRating: number;
  reviewCount: number;
}

let overrides: Record<number, RatingOverride> = {};
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function setRatingOverride(productId: number, value: RatingOverride) {
  const old = overrides[productId];
  if (old && old.avgRating === value.avgRating && old.reviewCount === value.reviewCount) return;
  overrides = { ...overrides, [productId]: value };
  listeners.forEach((l) => l());
}

export function resetRatingOverrides() {
  overrides = {};
  listeners.forEach((l) => l());
}

export const useRatingOverride = (productId: number): RatingOverride | undefined =>
  useSyncExternalStore(subscribe, () => overrides[productId], () => undefined);
