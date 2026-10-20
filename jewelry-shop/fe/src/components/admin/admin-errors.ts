import { isApiError } from "@/utils/errors";
import type { FormErrors } from "@/utils/validators";

/** Thông báo thân thiện cho mã lỗi riêng của khu quản trị. */
export const ADMIN_ERROR_MESSAGES: Record<string, string> = {
  UPLOAD_NOT_CONFIGURED: "Chưa cấu hình lưu trữ ảnh (Cloudinary). Vui lòng liên hệ quản trị hệ thống để bật tính năng tải ảnh.",
  UPLOAD_FAILED: "Tải ảnh lên không thành công, vui lòng thử lại sau.",
  INVALID_IMAGE: "Ảnh không hợp lệ: chỉ nhận jpg, png, webp, tối đa 5MB mỗi ảnh.",
  IMAGE_LIMIT_EXCEEDED: "Vượt quá số ảnh cho phép (tối đa 10 ảnh mỗi sản phẩm).",
  CANNOT_MODIFY_SELF: "Bạn không thể tự khóa hoặc tự đổi quyền của chính mình.",
  CANNOT_LOCK_ADMIN: "Không thể khóa tài khoản quản trị viên. Hãy hạ quyền tài khoản này xuống người dùng trước.",
  LAST_ADMIN: "Đây là quản trị viên cuối cùng nên không thể hạ quyền. Hãy cấp quyền quản trị cho người khác trước.",
  INSUFFICIENT_STOCK: "Không đủ tồn kho để trừ số lượng này.",
};

/** Mã lỗi 409 gắn vào ô của form sản phẩm. */
export const PRODUCT_CODE_FIELD: Record<string, string> = {
  PRODUCT_CODE_ALREADY_EXISTS: "code",
  SLUG_ALREADY_EXISTS: "slug",
};
export const SLUG_CODE_FIELD: Record<string, string> = { SLUG_ALREADY_EXISTS: "slug" };
export const NAME_CODE_FIELD: Record<string, string> = { NAME_ALREADY_EXISTS: "name" };

/** `variants[0].sku` -> `variants.0.sku` để khớp tên ô trong form. */
export function normalizeFieldPath(field: string): string {
  return field.replace(/\[(\d+)\]/g, ".$1");
}

export function adminErrorMessage(e: unknown): string {
  if (!isApiError(e)) return "Đã có lỗi xảy ra, vui lòng thử lại";
  return ADMIN_ERROR_MESSAGES[e.code] ?? e.message;
}

export function isInUse(e: unknown): boolean {
  return isApiError(e) && e.code === "RESOURCE_IN_USE";
}

/**
 * Gom lỗi server thành lỗi theo ô. `details[].field` giữ nguyên (ví dụ `variants.0.sku`),
 * mã 409 gắn vào ô qua `codeFields`. SKU trùng cố gắng gắn đúng dòng nếu server nêu SKU trong message.
 */
export function toAdminFormError(
  e: unknown,
  codeFields: Record<string, string> = {},
  resolve?: (e: { code: string; message: string }) => { field: string; message: string } | null,
): { fields: FormErrors; message: string } {
  if (!isApiError(e)) return { fields: {}, message: adminErrorMessage(e) };
  const fields: FormErrors = {};
  for (const d of e.details) {
    const field = normalizeFieldPath(d.field);
    if (field && !fields[field]) fields[field] = d.message;
  }
  const mapped = resolve?.(e);
  if (mapped) fields[mapped.field] = mapped.message;
  else if (codeFields[e.code]) fields[codeFields[e.code]] = adminErrorMessage(e);
  const hasFields = Object.keys(fields).length > 0;
  return { fields, message: hasFields ? "" : adminErrorMessage(e) };
}
