import { ROUTES } from "@/constants";

/** Trang không được làm đích quay lại (tránh vòng lặp hoặc thao tác ngoài ý muốn). */
const BLOCKED_PREFIXES = ["/login", "/logout", "/register", "/forgot-password", "/verify-otp", "/reset-password"];

const CONTROL_OR_SPACE = /[\u0000-\u001f\u007f-\u009f\s]/;
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;

/**
 * Chỉ chấp nhận đường dẫn nội bộ: bắt đầu bằng `/`, không `//`, không `\`, không chứa `://`,
 * không có ký tự điều khiển hoặc khoảng trắng. Chống open redirect.
 */
export function isSafeRedirect(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || value.includes("://")) return false;
  if (CONTROL_OR_SPACE.test(value)) return false;
  // Phòng trường hợp bị mã hóa: giải mã rồi kiểm tra lại các dấu hiệu nguy hiểm.
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }
  if (decoded.startsWith("//") || decoded.includes("\\") || decoded.includes("://")) return false;
  if (CONTROL.test(decoded)) return false;
  const path = value.split(/[?#]/)[0];
  if (BLOCKED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return false;
  return true;
}

/** Trả về đích hợp lệ hoặc `fallback` (trang theo role). */
export function safeRedirect(value: string | null | undefined, fallback: string): string {
  return isSafeRedirect(value) ? value : fallback;
}

/** `/login?redirect=<đường dẫn hiện tại>`; trang chủ hoặc đường dẫn không an toàn thì về `/login`. */
export function loginUrl(path: string): string {
  if (path === "/" || !isSafeRedirect(path)) return ROUTES.login;
  return `${ROUTES.login}?redirect=${encodeURIComponent(path)}`;
}

/** Đường dẫn hiện tại (kèm query) ở trình duyệt. */
export function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/** Đích sau đăng nhập: `?redirect=` nếu an toàn, không thì `fallback`. Chỉ gọi ở client. */
export function redirectTarget(fallback: string): string {
  return safeRedirect(new URLSearchParams(window.location.search).get("redirect"), fallback);
}
