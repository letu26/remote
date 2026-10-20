import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NavNode } from "@/utils/cms";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

import { DesktopNav, MobileNav } from "./NavMenu";

const items: NavNode[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Trang sức", href: "/products", children: [{ label: "Nhẫn", href: "/products?category=nhan" }, { label: "Bông tai", href: "/products?category=bong-tai" }] },
  { label: "Facebook", href: "https://facebook.com/x" },
];
afterEach(cleanup);

describe("DesktopNav", () => {
  it("mục có con: mở bằng nút, Esc đóng và trả focus về nút", () => {
    render(<nav><DesktopNav items={items} /></nav>);
    expect(screen.queryByRole("link", { name: "Nhẫn" })).toBeNull();
    const toggle = screen.getByRole("button", { name: "Menu con của Trang sức" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Nhẫn" })).toHaveAttribute("href", "/products?category=nhan");
    fireEvent.keyDown(screen.getByRole("link", { name: "Nhẫn" }), { key: "Escape" });
    expect(screen.queryByRole("link", { name: "Nhẫn" })).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });
  it("mở khi hover và khi focus, đóng khi rời", () => {
    render(<nav><DesktopNav items={items} /></nav>);
    const li = screen.getByRole("link", { name: "Trang sức" }).closest("li")!;
    fireEvent.mouseEnter(li);
    expect(screen.getByRole("link", { name: "Bông tai" })).toBeInTheDocument();
    fireEvent.mouseLeave(li);
    expect(screen.queryByRole("link", { name: "Bông tai" })).toBeNull();
    fireEvent.focus(screen.getByRole("link", { name: "Trang sức" }));
    expect(screen.getByRole("link", { name: "Nhẫn" })).toBeInTheDocument();
  });
  it("liên kết ngoài mở tab mới với rel an toàn; mục không con không có nút", () => {
    render(<nav><DesktopNav items={items} /></nav>);
    const ext = screen.getByRole("link", { name: "Facebook" });
    expect(ext).toHaveAttribute("target", "_blank");
    expect(ext.getAttribute("rel")).toContain("noopener");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

describe("MobileNav (accordion)", () => {
  it("mục con ẩn cho tới khi mở; bấm liên kết gọi onNavigate", () => {
    const onNavigate = vi.fn();
    render(<MobileNav items={items} onNavigate={onNavigate} />);
    const btn = screen.getByRole("button", { name: "Mở rộng Trang sức" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Nhẫn" })).toBeNull(); // hidden
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: "Thu gọn Trang sức" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("link", { name: "Nhẫn" }));
    expect(onNavigate).toHaveBeenCalled();
  });
});
