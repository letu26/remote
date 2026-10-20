import { describe, expect, it } from "vitest";
import type { CartItem } from "@/types/shop";
import {
  allSelected,
  maxQuantity,
  pruneSelection,
  selectableIds,
  selectedTotal,
  toggleAll,
  toggleOne,
} from "./cart-select";

const item = (id: number, over: Partial<CartItem> = {}): CartItem => ({
  id,
  variantId: id * 10,
  productId: id,
  productCode: `P${id}`,
  productName: `SP ${id}`,
  productSlug: `sp-${id}`,
  size: "12",
  imageUrl: null,
  price: 1000,
  salePrice: null,
  discountPercent: null,
  unitPrice: 1000,
  quantity: 2,
  lineTotal: 2000,
  stock: 5,
  available: true,
  issue: null,
  ...over,
});

const bad = (id: number) => item(id, { available: false, issue: "OUT_OF_STOCK", stock: 0, lineTotal: 9999 });
const items = [item(1), item(2, { lineTotal: 3000 }), bad(3)];

describe("chọn dòng giỏ hàng", () => {
  it("dòng có vấn đề không chọn được", () => {
    expect(selectableIds(items)).toEqual([1, 2]);
    expect(toggleOne(new Set(), bad(3)).size).toBe(0);
  });
  it("chọn và bỏ chọn từng dòng", () => {
    const one = toggleOne(new Set(), items[0]);
    expect([...one]).toEqual([1]);
    expect(toggleOne(one, items[0]).size).toBe(0);
  });
  it("chọn tất cả bỏ qua dòng có vấn đề; bấm lần nữa bỏ chọn hết", () => {
    const all = toggleAll(new Set(), items);
    expect([...all].sort()).toEqual([1, 2]);
    expect(allSelected(all, items)).toBe(true);
    expect(toggleAll(all, items).size).toBe(0);
  });
  it("giỏ chỉ có dòng lỗi thì không thể chọn tất cả", () => {
    expect(allSelected(new Set(), [bad(1)])).toBe(false);
    expect(toggleAll(new Set(), [bad(1)]).size).toBe(0);
  });
  it("tổng tiền chỉ cộng lineTotal của dòng đang chọn và chọn được", () => {
    expect(selectedTotal(new Set(), items)).toBe(0);
    expect(selectedTotal(new Set([1]), items)).toBe(2000);
    expect(selectedTotal(new Set([1, 2]), items)).toBe(5000);
    // id của dòng lỗi lọt vào tập chọn cũng không được cộng
    expect(selectedTotal(new Set([1, 3]), items)).toBe(2000);
  });
  it("loại khỏi tập chọn các dòng đã biến mất hoặc thành lỗi", () => {
    const next = pruneSelection(new Set([1, 2, 3, 99]), [item(1), bad(2), bad(3)]);
    expect([...next]).toEqual([1]);
  });
  it("số lượng tối đa = min(10, tồn kho), tối thiểu 1", () => {
    expect(maxQuantity(item(1, { stock: 50 }))).toBe(10);
    expect(maxQuantity(item(1, { stock: 4 }))).toBe(4);
    expect(maxQuantity(item(1, { stock: 0 }))).toBe(1);
  });
});
