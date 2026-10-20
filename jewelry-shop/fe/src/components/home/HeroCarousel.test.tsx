import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Banner } from "@/types/cms";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

import { CAROUSEL_INTERVAL_MS, HeroCarousel } from "./HeroCarousel";

const banner = (id: number, over: Partial<Banner> = {}): Banner => ({
  id, title: `Banner ${id}`, imageUrl: `https://res.cloudinary.com/x/${id}.jpg`, linkUrl: null, position: "home_hero", sortOrder: id, ...over,
});
const banners = [banner(1, { linkUrl: "/products" }), banner(2, { linkUrl: "https://ext.example/x" }), banner(3)];

function mockReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (q: string) => ({
      matches: reduce && q.includes("reduce"),
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

const active = () =>
  [...document.querySelectorAll('[aria-roledescription="slide"]')].findIndex(
    (g) => g.getAttribute("aria-hidden") === "false",
  ) + 1;
const tick = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

beforeEach(() => {
  vi.useFakeTimers();
  mockReducedMotion(false);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("HeroCarousel", () => {
  it("ảnh có alt = title; nội bộ dùng Link, ngoài mở tab mới với rel an toàn", () => {
    render(<HeroCarousel banners={banners} />);
    expect(screen.getByAltText("Banner 1")).toBeInTheDocument();
    const internal = screen.getByAltText("Banner 1").closest("a")!;
    expect(internal).toHaveAttribute("href", "/products");
    expect(internal).not.toHaveAttribute("target");
    const external = screen.getByAltText("Banner 2").closest("a")!;
    expect(external).toHaveAttribute("target", "_blank");
    expect(external.getAttribute("rel")).toContain("noopener");
    expect(external.getAttribute("rel")).toContain("noreferrer");
    expect(screen.getByAltText("Banner 3").closest("a")).toBeNull();
  });

  it("tự chuyển slide theo chu kỳ", async () => {
    render(<HeroCarousel banners={banners} />);
    expect(active()).toBe(1);
    await tick(CAROUSEL_INTERVAL_MS + 50);
    expect(active()).toBe(2);
    await tick(CAROUSEL_INTERVAL_MS);
    await tick(CAROUSEL_INTERVAL_MS);
    expect(active()).toBe(1); // quay vòng
  });

  it("nút trước/sau và chấm chuyển hoạt động (quay vòng)", () => {
    render(<HeroCarousel banners={banners} />);
    fireEvent.click(screen.getByRole("button", { name: "Banner sau" }));
    expect(active()).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Banner trước" }));
    fireEvent.click(screen.getByRole("button", { name: "Banner trước" }));
    expect(active()).toBe(3);
    fireEvent.click(screen.getByRole("button", { name: "Chuyển tới banner 2" }));
    expect(active()).toBe(2);
    expect(screen.getByRole("button", { name: "Chuyển tới banner 2" })).toHaveAttribute("aria-current", "true");
  });

  it("tạm dừng khi rê chuột và khi focus, chạy lại khi rời", async () => {
    render(<HeroCarousel banners={banners} />);
    const region = screen.getByRole("region", { name: "Banner nổi bật" });
    fireEvent.mouseEnter(region);
    await tick(CAROUSEL_INTERVAL_MS * 3);
    expect(active()).toBe(1);
    fireEvent.mouseLeave(region);
    fireEvent.focus(screen.getByRole("button", { name: "Banner sau" }));
    await tick(CAROUSEL_INTERVAL_MS * 3);
    expect(active()).toBe(1);
    fireEvent.blur(screen.getByRole("button", { name: "Banner sau" }), { relatedTarget: document.body });
    await tick(CAROUSEL_INTERVAL_MS + 50);
    expect(active()).toBe(2);
  });

  it("giảm chuyển động: không tự chạy nhưng vẫn chuyển bằng nút", async () => {
    mockReducedMotion(true);
    render(<HeroCarousel banners={banners} />);
    await tick(CAROUSEL_INTERVAL_MS * 4);
    expect(active()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Banner sau" }));
    expect(active()).toBe(2);
  });

  it("một banner: không có nút điều khiển và không tự chạy", async () => {
    render(<HeroCarousel banners={[banner(1)]} />);
    expect(screen.queryByRole("button")).toBeNull();
    await tick(CAROUSEL_INTERVAL_MS * 2);
    expect(active()).toBe(1);
  });

  it("nút điều khiển là button (focus và kích hoạt bằng bàn phím)", () => {
    render(<HeroCarousel banners={banners} />);
    const next = screen.getByRole("button", { name: "Banner sau" });
    next.focus();
    expect(document.activeElement).toBe(next);
  });
});
