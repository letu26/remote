import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const svc = vi.hoisted(() => ({ siteInfo: vi.fn(), menus: vi.fn() }));
vi.mock("@/services/cms.service", () => ({ cmsService: svc }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

import { resetSiteStore } from "@/store/site-store";
import { SiteFooter } from "./SiteFooter";

beforeEach(() => {
  svc.siteInfo.mockReset();
  svc.menus.mockReset();
  resetSiteStore();
});
afterEach(cleanup);

describe("SiteFooter", () => {
  it("API lỗi: vẫn có thương hiệu, liên hệ và liên kết dự phòng (không trống)", async () => {
    svc.siteInfo.mockRejectedValue(new Error("x"));
    svc.menus.mockRejectedValue(new Error("x"));
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: /Trang chủ/ })).toBeInTheDocument();
    expect(screen.getByText(/Giờ mở cửa:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chính sách bảo hành/ })).toHaveAttribute("href", "/pages/chinh-sach-bao-hanh");
    expect(screen.queryByRole("list", { name: "Mạng xã hội" })).toBeNull();
  });

  it("dùng site-info từ API; chỉ hiện mạng xã hội có giá trị; tel/mailto đúng", async () => {
    svc.siteInfo.mockResolvedValue({
      brandName: "Shop Mẫu", slogan: "Khẩu hiệu mẫu", hotline: "1900 1111", email: "a@shop.vn", address: "Hà Nội",
      openingHours: "8h-21h", facebook: "https://facebook.com/shop", zalo: "", instagram: "", tiktok: "", footerText: "Cảm ơn bạn",
    });
    svc.menus.mockImplementation(async (p: string) => (p === "footer" ? [{ id: 1, label: "Hỏi đáp", url: "/faq", children: [] }] : []));
    render(<SiteFooter />);
    expect(await screen.findByText("Khẩu hiệu mẫu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1900 1111" })).toHaveAttribute("href", "tel:19001111");
    expect(screen.getByRole("link", { name: "a@shop.vn" })).toHaveAttribute("href", "mailto:a@shop.vn");
    expect(screen.getByText("Cảm ơn bạn")).toBeInTheDocument();
    const social = screen.getByRole("list", { name: "Mạng xã hội" });
    expect(social.querySelectorAll("li")).toHaveLength(1);
    const fb = screen.getByRole("link", { name: "Facebook" });
    expect(fb).toHaveAttribute("target", "_blank");
    expect(fb.getAttribute("rel")).toContain("noopener");
    expect(await screen.findByRole("link", { name: "Hỏi đáp" })).toHaveAttribute("href", "/faq");
    expect(screen.queryByRole("link", { name: /Chính sách bảo hành/ })).toBeNull(); // menu CMS thay dự phòng
  });
});
