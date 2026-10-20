export type FormErrors = Record<string, string>;

export const PHONE_REGEX = /^0\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 6;

export function validatePhone(v: string): string | undefined {
  if (!v.trim()) return "Vui lòng nhập số điện thoại";
  if (!PHONE_REGEX.test(v.trim()))
    return "Số điện thoại gồm 10 số và bắt đầu bằng 0";
}

export function validateEmail(v: string): string | undefined {
  if (!v.trim()) return "Vui lòng nhập email";
  if (!EMAIL_REGEX.test(v.trim())) return "Email không đúng định dạng";
}

export function validateFullName(v: string): string | undefined {
  const t = v.trim();
  if (!t) return "Vui lòng nhập họ và tên";
  if (t.length < 2 || t.length > 100) return "Họ và tên từ 2 đến 100 ký tự";
}

export function validatePassword(v: string, label = "mật khẩu"): string | undefined {
  if (!v) return `Vui lòng nhập ${label}`;
  if (v.length < MIN_PASSWORD) return `Mật khẩu tối thiểu ${MIN_PASSWORD} ký tự`;
}

export function validateConfirm(password: string, confirm: string): string | undefined {
  if (!confirm) return "Vui lòng xác nhận mật khẩu";
  if (password !== confirm) return "Mật khẩu xác nhận không khớp";
}

function collect(entries: Record<string, string | undefined>): FormErrors {
  const out: FormErrors = {};
  for (const [k, v] of Object.entries(entries)) if (v) out[k] = v;
  return out;
}

export function validateLogin(v: { phone: string; password: string }): FormErrors {
  return collect({
    phone: validatePhone(v.phone),
    password: v.password ? undefined : "Vui lòng nhập mật khẩu",
  });
}

export function validateRegister(v: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}): FormErrors {
  return collect({
    fullName: validateFullName(v.fullName),
    email: validateEmail(v.email),
    phone: validatePhone(v.phone),
    password: validatePassword(v.password),
    confirmPassword: validateConfirm(v.password, v.confirmPassword),
    acceptTerms: v.acceptTerms ? undefined : "Bạn cần đồng ý với điều khoản",
  });
}

export function validateForgot(v: { email: string }): FormErrors {
  return collect({ email: validateEmail(v.email) });
}

export function validateReset(v: {
  newPassword: string;
  confirmPassword: string;
}): FormErrors {
  return collect({
    newPassword: validatePassword(v.newPassword, "mật khẩu mới"),
    confirmPassword: validateConfirm(v.newPassword, v.confirmPassword),
  });
}

export function validateProfile(v: {
  fullName: string;
  email: string;
  phone: string;
}): FormErrors {
  return collect({
    fullName: validateFullName(v.fullName),
    email: validateEmail(v.email),
    phone: validatePhone(v.phone),
  });
}

export function validateChangePassword(v: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): FormErrors {
  return collect({
    currentPassword: v.currentPassword ? undefined : "Vui lòng nhập mật khẩu hiện tại",
    newPassword: validatePassword(v.newPassword, "mật khẩu mới"),
    confirmPassword: validateConfirm(v.newPassword, v.confirmPassword),
  });
}

export const OTP_LENGTH = 6;

/** Chỉ giữ chữ số, tối đa 6 ký tự (dùng cho nhập tay và dán). */
export function sanitizeOtp(v: string): string {
  return v.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function validateOtp(v: string): string | undefined {
  if (!v) return "Vui lòng nhập mã OTP";
  if (!/^\d{6}$/.test(v)) return "Mã OTP gồm đúng 6 chữ số";
}

export interface AddressFormValues {
  receiverName: string;
  receiverPhone: string;
  provinceId: string;
  wardId: string;
  detail: string;
}

/** Khớp hợp đồng: tên 2..100, SĐT VN, tỉnh và xã bắt buộc, địa chỉ chi tiết 5..255. */
export function validateAddress(v: AddressFormValues): FormErrors {
  const name = v.receiverName.trim();
  const detail = v.detail.trim();
  return collect({
    receiverName: !name
      ? "Vui lòng nhập họ tên người nhận"
      : name.length < 2 || name.length > 100
        ? "Họ tên từ 2 đến 100 ký tự"
        : undefined,
    receiverPhone: validatePhone(v.receiverPhone),
    provinceId: v.provinceId ? undefined : "Vui lòng chọn tỉnh/thành phố",
    wardId: v.wardId ? undefined : "Vui lòng chọn xã/phường",
    detail: !detail
      ? "Vui lòng nhập địa chỉ chi tiết"
      : detail.length < 5 || detail.length > 255
        ? "Địa chỉ chi tiết từ 5 đến 255 ký tự"
        : undefined,
  });
}

export const REVIEW_COMMENT_MAX = 1000;

/** Khớp hợp đồng: sao nguyên 1..5, nhận xét (sau khi cắt khoảng trắng) tối đa 1000 ký tự. */
export function validateReview(v: { rating: number; comment: string }): FormErrors {
  return collect({
    rating: Number.isInteger(v.rating) && v.rating >= 1 && v.rating <= 5 ? undefined : "Vui lòng chọn số sao từ 1 đến 5",
    comment: v.comment.trim().length > REVIEW_COMMENT_MAX ? `Nhận xét tối đa ${REVIEW_COMMENT_MAX} ký tự` : undefined,
  });
}
