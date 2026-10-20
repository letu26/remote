import { describe, expect, it } from "vitest";
import type { MenuItem } from "@/types/cms";
import { FALLBACK_SITE_INFO, isSafeLink, mergeSiteInfo, normalizeMenu, socialLinks, telHref } from "./cms";

describe("mergeSiteInfo", () => {
  it("API lỗi/rỗng: dùng hằng số dự phòng", () => {
    expect(mergeSiteInfo(null)).toEqual(FALLBACK_SITE_INFO);
    expect(mergeSiteInfo(undefined)).toEqual(FALLBACK_SITE_INFO);
    expect(mergeSiteInfo({})).toEqual(FALLBACK_SITE_INFO);
  });
  it("trường rỗng hoặc sai kiểu thì giữ dự phòng, trường có giá trị thì dùng", () => {
    const info = mergeSiteInfo({
      brandName: "  Cửa hàng X ",
      hotline: "",
      email: 123 as unknown as string,
      address: "Số 5, Hà Nội",
    });
    expect(info.brandName).toBe("Cửa hàng X");
    expect(info.hotline).toBe(FALLBACK_SITE_INFO.hotline);
    expect(info.email).toBe(FALLBACK_SITE_INFO.email);
    expect(info.address).toBe("Số 5, Hà Nội");
  });
});

describe("socialLinks", () => {
  it("chỉ hiện mạng xã hội có giá trị https hợp lệ", () => {
    const info = mergeSiteInfo({
      facebook: "https://facebook.com/shop",
      zalo: "",
      instagram: "javascript:alert(1)",
      tiktok: "http://insecure.example",
    });
    expect(socialLinks(info).map((s) => s.key)).toEqual(["facebook"]);
  });
  it("không có gì thì rỗng", () => expect(socialLinks(FALLBACK_SITE_INFO)).toEqual([]));
});

describe("isSafeLink", () => {
  it.each(["/products", "/products?category=nhan", "https://a.com/x", "http://a.com"])("chấp nhận %s", (u) =>
    expect(isSafeLink(u)).toBe(true),
  );
  it.each(["//evil.com", "javascript:alert(1)", "data:text/html,x", "", "/a b", "/\\evil", "ftp://x", "/a\nb"])(
    "từ chối %s",
    (u) => expect(isSafeLink(u)).toBe(false),
  );
});

describe("normalizeMenu", () => {
  const item = (over: Partial<MenuItem>): MenuItem => ({ id: 1, label: "Trang chủ", url: "/", children: [], ...over });
  it("ánh xạ cây hai cấp", () => {
    const tree = normalizeMenu([
      item({ label: "Trang sức", url: "/products", children: [{ id: 2, label: "Nhẫn", url: "/products?category=nhan" }] }),
    ]);
    expect(tree).toEqual([
      { label: "Trang sức", href: "/products", children: [{ label: "Nhẫn", href: "/products?category=nhan" }] },
    ]);
  });
  it("bỏ mục thiếu nhãn hoặc liên kết không an toàn (cả mục con)", () => {
    const tree = normalizeMenu([
      item({ label: "", url: "/x" }),
      item({ id: 2, label: "Xấu", url: "javascript:alert(1)" }),
      item({ id: 3, label: "Tốt", url: "/ok", children: [{ id: 4, label: "Con xấu", url: "//evil.com" }] }),
    ]);
    expect(tree).toEqual([{ label: "Tốt", href: "/ok" }]);
  });
  it("dữ liệu không phải mảng thì rỗng", () => {
    expect(normalizeMenu(null)).toEqual([]);
    expect(normalizeMenu({} as unknown as MenuItem[])).toEqual([]);
  });
});

describe("telHref", () => {
  it("bỏ khoảng trắng và ký tự lạ", () => expect(telHref("1900 6789")).toBe("tel:19006789"));
});
