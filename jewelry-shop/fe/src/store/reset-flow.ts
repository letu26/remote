/**
 * Trạng thái luồng quên mật khẩu (email, mốc hết hạn OTP, mốc được gửi lại, resetToken).
 * Lưu ở sessionStorage (không phải localStorage), xóa khi xong hoặc khi thoát luồng.
 * Có subscribe để component đọc qua useSyncExternalStore.
 */
const KEYS = {
  email: "resetFlow.email",
  otpExpiresAt: "resetFlow.otpExpiresAt",
  resendAt: "resetFlow.resendAt",
  resetToken: "resetFlow.resetToken",
} as const;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribeResetFlow(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* storage có thể bị chặn */
  }
  emit();
}

function readNumber(key: string): number | null {
  const v = Number(read(key));
  return Number.isFinite(v) && v > 0 ? v : null;
}

export const getResetEmail = () => read(KEYS.email);
export const setResetEmail = (email: string) => write(KEYS.email, email);

export const getResetToken = () => read(KEYS.resetToken);
export const setResetToken = (token: string) => write(KEYS.resetToken, token);

/** Mốc (ms) OTP hết hạn. */
export const getOtpExpiresAt = () => readNumber(KEYS.otpExpiresAt);
/** Mốc (ms) được phép gửi lại mã. */
export const getResendAt = () => readNumber(KEYS.resendAt);
export const setResendAt = (ms: number) => write(KEYS.resendAt, String(ms));

export interface OtpTimers {
  otpExpiresAt: number | null;
  resendAt: number | null;
}

export function getOtpTimers(): OtpTimers {
  return { otpExpiresAt: getOtpExpiresAt(), resendAt: getResendAt() };
}

/** Tính mốc từ số giây backend trả về. Gọi trong event handler, không gọi lúc render. */
export function setOtpTimers(expiresInSeconds: number, resendAfterSeconds: number, now = Date.now()): OtpTimers {
  const timers = {
    otpExpiresAt: now + expiresInSeconds * 1000,
    resendAt: now + resendAfterSeconds * 1000,
  };
  write(KEYS.otpExpiresAt, String(timers.otpExpiresAt));
  write(KEYS.resendAt, String(timers.resendAt));
  return timers;
}

/** Xóa toàn bộ dữ liệu luồng quên mật khẩu. */
export function clearResetFlow() {
  try {
    Object.values(KEYS).forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  emit();
}
