/** Lịch sử xem sản phẩm lưu ở trình duyệt (khách vãng lai cũng có), dùng để gợi ý. */
export interface ViewedProduct {
  productId: number;
  count: number;
}

export const VIEW_HISTORY_KEY = "view.history";
export const VIEW_HISTORY_MAX = 30;

/** Mới xem nhất đứng đầu; dữ liệu hỏng hoặc storage bị chặn thì trả mảng rỗng. */
export function loadViews(): ViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(window.localStorage.getItem(VIEW_HISTORY_KEY) ?? "[]");
    if (!Array.isArray(v)) return [];
    return v
      .filter((i): i is ViewedProduct => i && Number.isInteger(i.productId) && i.productId > 0 && Number.isInteger(i.count) && i.count > 0)
      .slice(0, VIEW_HISTORY_MAX);
  } catch {
    return [];
  }
}

export function recordView(productId: number) {
  const views = loadViews();
  const count = Math.min((views.find((i) => i.productId === productId)?.count ?? 0) + 1, 1000);
  try {
    window.localStorage.setItem(
      VIEW_HISTORY_KEY,
      JSON.stringify([{ productId, count }, ...views.filter((i) => i.productId !== productId)].slice(0, VIEW_HISTORY_MAX)),
    );
  } catch {
    /* storage có thể bị chặn */
  }
}
