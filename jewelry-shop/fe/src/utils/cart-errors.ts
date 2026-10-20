import { isApiError } from "./errors";

/** Thông báo rõ nghĩa cho lỗi giỏ hàng (API_CONTRACT_PHASE3.md). */
export function cartErrorMessage(err: unknown): string {
  if (!isApiError(err)) return "Đã có lỗi xảy ra, vui lòng thử lại";
  switch (err.code) {
    case "INSUFFICIENT_STOCK": {
      const { available, inCart } = err.extra as { available?: number; inCart?: number };
      if (typeof available === "number") {
        const inCartText = typeof inCart === "number" && inCart > 0 ? ` (trong giỏ của bạn đã có ${inCart})` : "";
        return available > 0 ? `Chỉ còn ${available} sản phẩm trong kho${inCartText}` : "Sản phẩm này đã hết hàng";
      }
      return err.message;
    }
    case "QUANTITY_LIMIT_EXCEEDED":
      return "Mỗi sản phẩm chỉ được mua tối đa 10 trong một lần";
    case "ITEM_UNAVAILABLE":
      return "Sản phẩm này hiện đã ngừng bán";
    default:
      return err.message;
  }
}
