import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ articles: vi.fn(), faqs: vi.fn(), replace: vi.fn(), push: vi.fn(), search: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: m.replace, push: m.push }),
  usePathname: () => "/articles",
  useSearchParams: () => new URLSearchParams(m.search),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("@/services/cms.service", () => ({
  cmsService: { articles: (...a: unknown[]) => m.articles(...a), faqs: (...a: unknown[]) => m.faqs(...a) },
}));

import { MarkdownContent } from "@/components/common/MarkdownContent";
import { ArticlesView } from "./ArticlesView";
import { FaqView } from "./FaqView";

const art = (id: number) => ({ id, title: `Bài ${id}`, slug: `bai-${id}`, summary: `Tóm tắt ${id}`, thumbnailUrl: null, publishedAt: "2026-10-17T02:00:00.000Z" });
const page = (n: number, p = 1, total = n) => ({ items: Array.from({ length: n }, (_, i) => art(i + 1)), page: p, pageSize: 9, total, totalPages: Math.ceil(total / 9) });

beforeEach(() => {
  Object.values(m).forEach((f) => typeof f === "function" && "mockReset" in f && f.mockReset());
  m.search = "";
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("MarkdownContent (bài viết / trang nội dung)", () => {
  it("không cho HTML thô: <script>, <img onerror>, <iframe> hiển thị như chữ", () => {
    const { container } = render(
      <MarkdownContent>{'Xin chào\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(2)>\n\n<iframe src="https://evil"></iframe>'}</MarkdownContent>,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("img[onerror]")).toBeNull();
  });
  it("liên kết ngoài mở tab mới với rel an toàn; javascript: bị lọc", () => {
    render(<MarkdownContent>{"[ngoài](https://example.com) và [xấu](javascript:alert(1)) và [trong](/faq)"}</MarkdownContent>);
    const ext = screen.getByRole("link", { name: "ngoài" });
    expect(ext).toHaveAttribute("target", "_blank");
    expect(ext.getAttribute("rel")).toContain("noopener");
    const bad = screen.queryByRole("link", { name: "xấu" });
    expect(bad?.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
    expect(screen.getByRole("link", { name: "trong" })).not.toHaveAttribute("target");
  });
  it("hiển thị Markdown cơ bản (tiêu đề, danh sách, bảng GFM)", () => {
    render(<MarkdownContent>{"## Tiêu đề\n\n- một\n- hai\n\n| a | b |\n|---|---|\n| 1 | 2 |"}</MarkdownContent>);
    expect(screen.getByRole("heading", { name: "Tiêu đề" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});

describe("FaqView (accordion)", () => {
  it("câu trả lời ẩn cho tới khi mở; aria-expanded/aria-controls đúng; văn bản thuần", async () => {
    m.faqs.mockResolvedValue([{ id: 1, question: "Giờ mở cửa?", answer: "8h-21h\n<b>mỗi ngày</b>" }]);
    const { container } = render(<FaqView />);
    const btn = await screen.findByRole("button", { name: /Giờ mở cửa/ });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    const panelId = btn.getAttribute("aria-controls")!;
    expect(document.getElementById(panelId)).toHaveAttribute("hidden");
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(panelId)).not.toHaveAttribute("hidden");
    expect(container.querySelector("b")).toBeNull();
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });
  it("rỗng và lỗi có trạng thái riêng", async () => {
    m.faqs.mockResolvedValueOnce([]);
    const a = render(<FaqView />);
    expect(await screen.findByText("Chưa có câu hỏi nào")).toBeInTheDocument();
    a.unmount();
    m.faqs.mockRejectedValueOnce(new Error("x"));
    render(<FaqView />);
    expect(await screen.findByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("ArticlesView", () => {
  it("hiện lưới thẻ bài viết và phân trang", async () => {
    m.articles.mockResolvedValue(page(3, 1, 20));
    render(<ArticlesView />);
    expect(await screen.findByRole("link", { name: "Bài 1" })).toHaveAttribute("href", "/articles/bai-1");
    expect(screen.getByRole("navigation", { name: "Phân trang" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /2/ }));
    expect(m.push).toHaveBeenCalledWith("/articles?page=2");
  });
  it("tìm kiếm debounce 500ms rồi đưa q lên URL", async () => {
    vi.useFakeTimers();
    m.articles.mockResolvedValue(page(1));
    render(<ArticlesView />);
    await act(async () => { await Promise.resolve(); });
    fireEvent.change(screen.getByLabelText("Tìm bài viết"), { target: { value: "nhẫn" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(m.replace).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(150); });
    expect(m.replace).toHaveBeenCalledWith("/articles?q=n%E1%BA%ABn".replace("n%E1%BA%ABn", encodeURIComponent("nhẫn")), { scroll: false });
  });
  it("đọc q và page từ URL để gọi API", async () => {
    m.search = "q=kim+c%C6%B0%C6%A1ng&page=2";
    m.articles.mockResolvedValue(page(1, 2, 12));
    render(<ArticlesView />);
    await waitFor(() => expect(m.articles).toHaveBeenCalledWith({ page: 2, pageSize: 9, q: "kim cương" }, expect.anything()));
    expect(screen.getByLabelText("Tìm bài viết")).toHaveValue("kim cương");
  });
  it("empty state khi tìm không có kết quả; lỗi có nút thử lại", async () => {
    m.search = "q=zzz";
    m.articles.mockResolvedValueOnce(page(0));
    const a = render(<ArticlesView />);
    expect(await screen.findByText("Không tìm thấy bài viết phù hợp")).toBeInTheDocument();
    a.unmount();
    m.search = "";
    m.articles.mockRejectedValueOnce(new Error("x"));
    render(<ArticlesView />);
    expect(await screen.findByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
