import { describe, expect, it } from "vitest";
import {
  validateAddress, validateReview, sanitizeOtp, validateConfirm, validateEmail, validateLogin, validateOtp, validatePassword, validatePhone,
  FULL_NAME_CHARS_MESSAGE,
  fullNameNotice,
  sanitizeFullName,
  validateFullName,
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

describe("validateFullName: chỉ cho phép chữ", () => {
  it.each(["Nguyễn Văn Nam", "Lê Thị Bích Ngọc", "Đặng Khánh Linh", "Nguyễn T. Lan", "O'Brien", "Anne-Marie", "Tú"])(
    "chấp nhận %s",
    (name) => expect(validateFullName(name)).toBeUndefined(),
  );
  it.each(["12345", "abc123", "Nam 2", "@@", "A_B", "123 Nguyễn", "-Nam", "Nam<script>"])("từ chối %s", (name) =>
    expect(validateFullName(name)).toBe(FULL_NAME_CHARS_MESSAGE),
  );
  it("lỗi độ dài (2 đến 25) và để trống", () => {
    expect(validateFullName("   ")).toBe("Vui lòng nhập họ và tên");
    expect(validateFullName("A")).toBe("Họ và tên từ 2 đến 25 ký tự");
    expect(validateFullName("A".repeat(26))).toBe("Họ và tên từ 2 đến 25 ký tự");
  });
});

describe("sanitizeFullName: lọc khi gõ hoặc dán", () => {
  it("bỏ số và ký tự đặc biệt, giữ chữ có dấu, khoảng trắng, nháy, gạch nối, chấm", () => {
    expect(sanitizeFullName("Nguyễn Văn Nam123")).toBe("Nguyễn Văn Nam");
    expect(sanitizeFullName("12345")).toBe("");
    expect(sanitizeFullName("Nam<script>@#")).toBe("Namscript");
    expect(sanitizeFullName("O'Brien - Anne.Marie")).toBe("O'Brien - Anne.Marie");
    expect(sanitizeFullName("Đặng Khánh Linh")).toBe("Đặng Khánh Linh");
  });
  it("cắt tối đa 25 ký tự", () => {
    expect(sanitizeFullName("A".repeat(150))).toHaveLength(25);
  });
  it("fullNameNotice: báo ký tự không hợp lệ, báo quá 25 ký tự, rỗng khi hợp lệ", () => {
    expect(fullNameNotice("Nam1")).toMatch(/chỉ được nhập chữ cái/);
    expect(fullNameNotice("A".repeat(26))).toBe("Họ và tên từ 2 đến 25 ký tự");
    expect(fullNameNotice("A".repeat(25))).toBe("");
    expect(fullNameNotice("Nguyễn Văn Nam")).toBe("");
  });
});
