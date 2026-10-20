import type { CartItem } from "@/types/shop";

/** Dòng có thể chọn: không có vấn đề (hết hàng, thiếu tồn, ngừng bán). */
export const isSelectable = (item: CartItem) => item.issue === null && item.available;

export const selectableIds = (items: CartItem[]) => items.filter(isSelectable).map((i) => i.id);

/** Giữ lại các id còn tồn tại và còn chọn được (sau khi giỏ đổi). */
export function pruneSelection(selected: ReadonlySet<number>, items: CartItem[]): Set<number> {
  const ok = new Set(selectableIds(items));
  return new Set([...selected].filter((id) => ok.has(id)));
}

export function toggleOne(selected: ReadonlySet<number>, item: CartItem): Set<number> {
  const next = new Set(selected);
  if (!isSelectable(item)) return next;
  if (next.has(item.id)) next.delete(item.id);
  else next.add(item.id);
  return next;
}

export function allSelected(selected: ReadonlySet<number>, items: CartItem[]): boolean {
  const ids = selectableIds(items);
  return ids.length > 0 && ids.every((id) => selected.has(id));
}

/** Chọn tất cả dòng chọn được; đang chọn hết thì bỏ chọn hết. */
export function toggleAll(selected: ReadonlySet<number>, items: CartItem[]): Set<number> {
  return allSelected(selected, items) ? new Set() : new Set(selectableIds(items));
}

/** Tổng tiền các dòng đang chọn, cộng từ `lineTotal` của API (không tự tính lại giá). */
export function selectedTotal(selected: ReadonlySet<number>, items: CartItem[]): number {
  return items.reduce((sum, i) => (selected.has(i.id) && isSelectable(i) ? sum + i.lineTotal : sum), 0);
}

/** Số lượng sản phẩm tối đa của một dòng: min(10, tồn kho). */
export const maxQuantity = (item: CartItem) => Math.max(1, Math.min(10, item.stock));

export const ISSUE_LABEL: Record<NonNullable<CartItem["issue"]>, string> = {
  UNAVAILABLE: "Ngừng bán",
  OUT_OF_STOCK: "Hết hàng",
  INSUFFICIENT_STOCK: "Không đủ tồn kho",
};
