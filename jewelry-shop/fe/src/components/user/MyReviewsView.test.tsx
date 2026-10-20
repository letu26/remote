import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ mine: vi.fn(), remove: vi.fn(), confirm: vi.fn(), notify: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("@/services/review.service", () => ({
  reviewService: { mine: (...a: unknown[]) => m.mine(...a), remove: (...a: unknown[]) => m.remove(...a) },
}));
vi.mock("@/utils/confirm", () => ({ confirmAction: (...a: unknown[]) => m.confirm(...a) }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));

import { MyReviewsView } from "./MyReviewsView";

const item = (id: number, over = {}) => ({
  id, productId: id, productName: `Nhẫn ${id}`, productSlug: `nhan-${id}`, rating: 5, comment: `Nhận xét ${id}`,
  isHidden: false, createdAt: "2026-10-17T02:57:29.000Z", updatedAt: "2026-10-17T02:57:29.000Z", ...over,
});
const page = (items: ReturnType<typeof item>[]) => ({ items, page: 1, pageSize: 10, total: items.length, totalPages: 1 });

beforeEach(() => Object.values(m).forEach((f) => f.mockReset()));
afterEach(cleanup);

describe("MyReviewsView", () => {
  it("hiện sao, sản phẩm có liên kết, nhận xét, nhãn ẩn; Sửa dẫn tới trang sản phẩm #reviews", async () => {
    m.mine.mockResolvedValue(page([item(1), item(2, { isHidden: true })]));
    render(<MyReviewsView />);
    expect(await screen.findByRole("link", { name: "Nhẫn 1" })).toHaveAttribute("href", "/products/nhan-1");
    expect(screen.getByText("Nhận xét 2")).toBeInTheDocument();
    expect(screen.getAllByText("Đang bị ẩn bởi quản trị viên")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Sửa đánh giá Nhẫn 1" })).toHaveAttribute("href", "/products/nhan-1#reviews");
  });
  it("empty state", async () => {
    m.mine.mockResolvedValue(page([]));
    render(<MyReviewsView />);
    expect(await screen.findByText("Bạn chưa có đánh giá nào")).toBeInTheDocument();
  });
  it("xóa: hủy swal không gọi API; xác nhận thì gọi, toast và tải lại", async () => {
    m.mine.mockResolvedValue(page([item(1)]));
    m.remove.mockResolvedValue(undefined);
    render(<MyReviewsView />);
    await screen.findByText("Nhận xét 1");
    m.confirm.mockResolvedValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Xóa đánh giá Nhẫn 1" }));
    await waitFor(() => expect(m.confirm).toHaveBeenCalledTimes(1));
    expect(m.remove).not.toHaveBeenCalled();
    m.confirm.mockResolvedValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Xóa đánh giá Nhẫn 1" }));
    await waitFor(() => expect(m.remove).toHaveBeenCalledWith(1));
    expect(m.notify).toHaveBeenCalledWith("success", "Đã xóa đánh giá");
    await waitFor(() => expect(m.mine).toHaveBeenCalledTimes(2));
  });
  it("lỗi tải: error state có nút thử lại", async () => {
    m.mine.mockRejectedValueOnce(new Error("x"));
    render(<MyReviewsView />);
    const retry = await screen.findByRole("button", { name: "Thử lại" });
    m.mine.mockResolvedValue(page([item(1)]));
    fireEvent.click(retry);
    expect(await screen.findByText("Nhận xét 1")).toBeInTheDocument();
  });
});
