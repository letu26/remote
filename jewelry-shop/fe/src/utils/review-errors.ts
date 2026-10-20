import { ApiError, isApiError } from "./errors";

const MESSAGES: Record<string, string> = {
  REVIEW_NOT_ALLOWED: "Chỉ khách đã mua và nhận hàng mới có thể đánh giá sản phẩm này",
  REVIEW_ALREADY_EXISTS: "Bạn đã đánh giá sản phẩm này rồi",
  REVIEW_HIDDEN: "Đánh giá của bạn đang bị ẩn bởi quản trị viên nên không thể sửa",
};

/** Mã lỗi đánh giá cho biết trạng thái khung viết đã cũ, cần tải lại. */
export const isReviewStateError = (e: unknown): e is ApiError =>
  isApiError(e) && e.code in MESSAGES;

export function reviewErrorMessage(err: unknown): string {
  if (!isApiError(err)) return "Đã có lỗi xảy ra, vui lòng thử lại";
  return MESSAGES[err.code] ?? err.message;
}
