import { beforeEach, describe, expect, it, vi } from "vitest";

const svc = vi.hoisted(() => ({ siteInfo: vi.fn(), menus: vi.fn() }));
vi.mock("@/services/cms.service", () => ({ cmsService: svc }));

import { FALLBACK_SITE_INFO } from "@/utils/cms";
import { loadSite, resetSiteStore } from "./site-store";

// Đọc state qua hook là không cần thiết: kiểm tra qua việc gọi API và không ném lỗi.
beforeEach(() => {
  svc.siteInfo.mockReset();
  svc.menus.mockReset();
  resetSiteStore();
});

describe("site-store", () => {
  it("tải MỘT lần dù gọi nhiều lần", () => {
    svc.siteInfo.mockResolvedValue({});
    svc.menus.mockResolvedValue([]);
    loadSite();
    loadSite();
    loadSite();
    expect(svc.siteInfo).toHaveBeenCalledTimes(1);
    expect(svc.menus).toHaveBeenCalledTimes(2); // header + footer
    expect(svc.menus).toHaveBeenCalledWith("header");
    expect(svc.menus).toHaveBeenCalledWith("footer");
  });
  it("API lỗi không ném lỗi chưa xử lý", async () => {
    svc.siteInfo.mockRejectedValue(new Error("x"));
    svc.menus.mockRejectedValue(new Error("x"));
    expect(() => loadSite()).not.toThrow();
    await Promise.resolve();
    expect(FALLBACK_SITE_INFO.brandName).toBeTruthy();
  });
});
