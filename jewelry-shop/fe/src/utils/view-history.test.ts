import { beforeEach, describe, expect, it } from "vitest";
import { loadViews, recordView, VIEW_HISTORY_KEY, VIEW_HISTORY_MAX } from "./view-history";

beforeEach(() => localStorage.clear());

describe("view-history", () => {
  it("cộng số lần xem và đưa sản phẩm mới xem lên đầu", () => {
    recordView(1);
    recordView(2);
    recordView(1);
    expect(loadViews()).toEqual([{ productId: 1, count: 2 }, { productId: 2, count: 1 }]);
  });

  it("giới hạn số sản phẩm, bỏ qua dữ liệu hỏng", () => {
    for (let id = 1; id <= VIEW_HISTORY_MAX + 5; id++) recordView(id);
    expect(loadViews()).toHaveLength(VIEW_HISTORY_MAX);
    localStorage.setItem(VIEW_HISTORY_KEY, "{hỏng");
    expect(loadViews()).toEqual([]);
  });
});
