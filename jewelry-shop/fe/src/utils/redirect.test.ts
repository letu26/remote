import { describe, expect, it } from "vitest";
import { isSafeRedirect, loginUrl, safeRedirect } from "./redirect";

describe("isSafeRedirect", () => {
  it.each(["/cart", "/products?category=nhan&page=2", "/user/wishlist", "/products/nhan-vang#reviews", "/a/b%20c"])(
    "chấp nhận đường dẫn nội bộ %s",
    (v) => expect(isSafeRedirect(v)).toBe(true),
  );

  it.each([
    ["//evil.com", "protocol-relative"],
    ["///evil.com", "nhiều dấu gạch"],
    ["https://evil.com", "URL tuyệt đối"],
    ["http://evil.com/x", "http"],
    ["/\\evil.com", "gạch ngược sau /"],
    ["\\\\evil.com", "gạch ngược"],
    ["/\\/evil.com", "gạch ngược lẫn"],
    ["javascript:alert(1)", "javascript"],
    ["JaVaScRiPt:alert(1)", "javascript hoa thường"],
    ["data:text/html,<script>", "data"],
    ["/redir?u=https://evil.com", "chứa ://"],
    ["/%2F/evil.com", "// mã hóa"],
    ["/%5Cevil.com", "gạch ngược mã hóa"],
    ["/%2f%2fevil.com", "// mã hóa thường"],
    ["/a\nb", "xuống dòng"],
    ["/a\r\nSet-Cookie: x=1", "CRLF"],
    ["/a\tb", "tab"],
    ["/a\u0000b", "null"],
    ["/%0d%0aevil", "CRLF mã hóa"],
    ["/a b", "khoảng trắng"],
    [" /cart", "khoảng trắng đầu"],
    ["cart", "không bắt đầu bằng /"],
    ["", "rỗng"],
    ["/%E0%A4%A", "mã hóa hỏng"],
    ["/login", "trang đăng nhập (tránh vòng lặp)"],
    ["/login?redirect=/cart", "trang đăng nhập kèm query"],
    ["/logout", "đăng xuất"],
  ])("từ chối %s (%s)", (v) => expect(isSafeRedirect(v)).toBe(false));

  it("từ chối giá trị không phải chuỗi và chuỗi quá dài", () => {
    expect(isSafeRedirect(null)).toBe(false);
    expect(isSafeRedirect(undefined)).toBe(false);
    expect(isSafeRedirect(123)).toBe(false);
    expect(isSafeRedirect(`/${"a".repeat(3000)}`)).toBe(false);
  });
});

describe("safeRedirect", () => {
  it("hợp lệ thì dùng, không thì rơi về fallback", () => {
    expect(safeRedirect("/cart", "/user")).toBe("/cart");
    expect(safeRedirect("//evil.com", "/user")).toBe("/user");
    expect(safeRedirect(null, "/admin")).toBe("/admin");
    expect(safeRedirect("https://x", "/admin")).toBe("/admin");
  });
});

describe("loginUrl", () => {
  it("mã hóa đường dẫn hiện tại", () => {
    expect(loginUrl("/products?category=nhan")).toBe("/login?redirect=%2Fproducts%3Fcategory%3Dnhan");
  });
  it("trang chủ hoặc đường dẫn không an toàn thì về /login", () => {
    expect(loginUrl("/")).toBe("/login");
    expect(loginUrl("//evil.com")).toBe("/login");
  });
});
