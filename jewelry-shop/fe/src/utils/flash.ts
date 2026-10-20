import type { NotifyKind } from "./notify";
/** Thông báo một lần, sống qua chuyển trang (kể cả tải lại toàn bộ). Lưu ở sessionStorage. */
const FLASH_KEY = "flashMessage";

export interface Flash {
  kind: NotifyKind;
  message: string;
}

export function setFlash(kind: Flash["kind"], message: string) {
  try {
    window.sessionStorage.setItem(FLASH_KEY, JSON.stringify({ kind, message }));
  } catch {
    /* storage có thể bị chặn */
  }
}

/** Đọc rồi xóa ngay. */
export function consumeFlash(): Flash | null {
  try {
    const raw = window.sessionStorage.getItem(FLASH_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(FLASH_KEY);
    const v = JSON.parse(raw) as Flash;
    return v && typeof v.message === "string" ? v : null;
  } catch {
    return null;
  }
}
