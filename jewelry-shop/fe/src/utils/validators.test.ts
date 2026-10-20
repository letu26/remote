import { describe, expect, it } from "vitest";
import {
  validateAddress, validateReview, sanitizeOtp, validateConfirm, validateEmail, validateLogin, validateOtp, validatePassword, validatePhone,
  validateRegister,
} from "./validators";

describe("OTP", () => {
  it("sanitizeOtp chỉ giữ số, tối đa 6", () => {
    expect(sanitizeOtp("12a3-45 6789")).toBe("123456");
    expect(sanitizeOtp("abc")).toBe("");
  });
  it("validateOtp đúng 6 chữ số", () => {
    expect(validateOtp("")).toMatch(/nhập/);
    expect(validateOtp("12345")).toMatch(/6 chữ số/);
    expect(validateOtp("12345a")).toMatch(/6 chữ số/);
    expect(validateOtp("123456")).toBeUndefined();
  });
});

describe("validatePhone", () => {
  it.each(["0912345678", "0999000111"])("hợp lệ: %s", (v) => expect(validatePhone(v)).toBeUndefined());
  it.each(["", "   ", "1912345678", "091234567", "09123456789", "09123abc78", "+84912345678"])(
    "không hợp lệ: [%s]", (v) => expect(validatePhone(v)).toBeTruthy());
});
describe("validateEmail", () => {
  it("hợp lệ", () => expect(validateEmail("a@b.co")).toBeUndefined());
  it.each(["", "abc", "a@b", "a b@c.com", "@c.com"])("không hợp lệ: [%s]", (v) => expect(validateEmail(v)).toBeTruthy());
});
describe("validatePassword", () => {
  it("6 ký tự hợp lệ", () => expect(validatePassword("123456")).toBeUndefined());
  it("5 ký tự và rỗng không hợp lệ", () => {
    expect(validatePassword("12345")).toBeTruthy();
    expect(validatePassword("")).toBeTruthy();
  });
});
describe("validateConfirm", () => {
  it("khớp / không khớp / rỗng", () => {
    expect(validateConfirm("abcdef", "abcdef")).toBeUndefined();
    expect(validateConfirm("abcdef", "abcdeg")).toBeTruthy();
    expect(validateConfirm("abcdef", "")).toBeTruthy();
  });
});
describe("validateRegister / validateLogin", () => {
  const ok = { fullName: "Nguyen Van A", email: "a@b.co", phone: "0912345678", password: "123456", confirmPassword: "123456", acceptTerms: true };
  it("hợp lệ -> không lỗi", () => expect(validateRegister(ok)).toEqual({}));
  it("chưa tick điều khoản", () => expect(validateRegister({ ...ok, acceptTerms: false })).toHaveProperty("acceptTerms"));
  it("nhiều lỗi cùng lúc", () => {
    const e = validateRegister({ ...ok, email: "x", phone: "1", password: "1", confirmPassword: "2", fullName: "" });
    expect(Object.keys(e).sort()).toEqual(["confirmPassword", "email", "fullName", "password", "phone"]);
  });
  it("login", () => {
    expect(validateLogin({ phone: "0912345678", password: "x" })).toEqual({});
    expect(Object.keys(validateLogin({ phone: "", password: "" })).sort()).toEqual(["password", "phone"]);
  });
});

describe("validateAddress", () => {
  const ok = { receiverName: "Nguyễn Văn A", receiverPhone: "0912345678", provinceId: "1", wardId: "2", detail: "12 Nguyễn Trãi" };
  it("hợp lệ thì không có lỗi", () => expect(validateAddress(ok)).toEqual({}));
  it("tên 2..100, SĐT VN, tỉnh và xã bắt buộc, chi tiết 5..255", () => {
    const e = validateAddress({ receiverName: "A", receiverPhone: "123", provinceId: "", wardId: "", detail: "abc" });
    expect(Object.keys(e).sort()).toEqual(["detail", "provinceId", "receiverName", "receiverPhone", "wardId"]);
    expect(validateAddress({ ...ok, receiverName: "a".repeat(101) }).receiverName).toBeTruthy();
    expect(validateAddress({ ...ok, detail: "a".repeat(256) }).detail).toBeTruthy();
    expect(validateAddress({ ...ok, detail: "     " }).detail).toBeTruthy();
  });
});

describe("validateReview", () => {
  it("sao nguyên 1..5", () => {
    expect(validateReview({ rating: 3, comment: "" })).toEqual({});
    for (const r of [0, 6, 2.5, NaN]) expect(validateReview({ rating: r, comment: "" }).rating).toBeTruthy();
  });
  it("nhận xét tối đa 1000 ký tự sau khi cắt khoảng trắng", () => {
    expect(validateReview({ rating: 5, comment: `  ${"a".repeat(1000)}  ` })).toEqual({});
    expect(validateReview({ rating: 5, comment: "a".repeat(1001) }).comment).toBeTruthy();
  });
});
