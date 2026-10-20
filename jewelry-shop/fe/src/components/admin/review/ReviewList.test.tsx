import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminReview } from "@/types/admin-review";

const replace = vi.fn();
let search = "";
let cache: { key: string; value: URLSearchParams } = { key: "", value: new URLSearchParams() };
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/admin/reviews",
  useSearchParams: () => {
    if (cache.key !== search) cache = { key: search, value: new URLSearchParams(search) };
    return cache.value;
  },
}));
vi.mock("@/services/admin-review.service", () => ({ adminReviewService: { list: vi.fn(), setHidden: vi.fn() } }));
vi.mock("@/utils/confirm", () => ({ confirmAction: vi.fn() }));
const notify = vi.fn();
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => notify(...a) }));

import { adminReviewService } from "@/services/admin-review.service";
import { confirmAction } from "@/utils/confirm";
import { ReviewList } from "./ReviewList";
import { buildReviewSearch, parseReviewFilters } from "./review-filters";

const svc = adminReviewService as unknown as Record<string, ReturnType<typeof vi.fn>>;
const confirm = confirmAction as unknown as ReturnType<typeof vi.fn>;

const review = (over: Partial<AdminReview> = {}): AdminReview => ({
  id: 1, productId: 9, productName: "Nhẫn vàng", productCode: "LG-001", productSlug: "nhan-vang", userId: 3,
  reviewerName: "Nguyễn Văn A", reviewerPhone: "0901234567", rating: 4, comment: "Đẹp lắm", isHidden: false,
  createdAt: "2026-10-17T03:00:00Z", updatedAt: "2026-10-17T03:00:00Z", ...over,
});
const page = (items: AdminReview[]) => ({ items, page: 1, pageSize: 20, total: items.length, totalPages: 1 });

beforeEach(() => {
  vi.clearAllMocks();
  search = "";
});
afterEach(cleanup);

describe("bộ lọc <-> URL", () => {
  it("parse bỏ giá trị sai và build lại", () => {
    const f = parseReviewFilters(new URLSearchParams("rating=9&hidden=true&productId=12&page=2&q=dep"));
    expect(f).toEqual({ q: "dep", rating: "", hidden: "true", productId: "12", page: 2 });
    expect(buildReviewSearch(f)).toBe("?q=dep&hidden=true&productId=12&page=2");
  });
  it("đọc URL gửi lên service (kể cả productId)", async () => {
    search = "rating=5&hidden=false&productId=9&q=dep";
    svc.list.mockResolvedValue(page([review()]));
    render(<ReviewList />);
    await waitFor(() => expect(svc.list).toHaveBeenCalled());
    expect(svc.list.mock.calls[0][0]).toMatchObject({ rating: 5, hidden: false, productId: 9, q: "dep", page: 1 });
  });
  it("đổi lọc số sao ghi lên URL về trang 1; tìm kiếm debounce 500ms", async () => {
    search = "page=3";
    svc.list.mockResolvedValue(page([review()]));
    render(<ReviewList />);
    await screen.findAllByText("Nguyễn Văn A");
    fireEvent.change(screen.getByLabelText("Số sao"), { target: { value: "2" } });
    expect(replace).toHaveBeenCalledWith("/admin/reviews?rating=2", { scroll: false });
    replace.mockClear();
    fireEvent.change(screen.getByLabelText("Tìm kiếm"), { target: { value: "dep" } });
    expect(replace).not.toHaveBeenCalled();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/reviews?q=dep&page=3".replace("&page=3", ""), { scroll: false }), { timeout: 2000 });
  });
});

describe("ẩn/hiện đánh giá", () => {
  it("hủy swal thì không gọi API; xác nhận thì gọi và toast", async () => {
    svc.list.mockResolvedValue(page([review()]));
    svc.setHidden.mockResolvedValue(review({ isHidden: true }));
    render(<ReviewList />);
    await screen.findAllByText("Nguyễn Văn A");
    const btn = () => screen.getAllByRole("button", { name: /đánh giá của Nguyễn Văn A/ })[0];
    confirm.mockResolvedValueOnce(false);
    fireEvent.click(btn());
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(svc.setHidden).not.toHaveBeenCalled();
    confirm.mockResolvedValueOnce(true);
    fireEvent.click(btn());
    await waitFor(() => expect(svc.setHidden).toHaveBeenCalledWith(1, true));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("success", "Đã ẩn đánh giá"));
    expect(screen.getAllByText("Đã ẩn").length).toBeGreaterThan(0);
    await waitFor(() => expect(btn()).toHaveAttribute("aria-label", "Hiện đánh giá của Nguyễn Văn A"));
  });
});

describe("hiển thị", () => {
  it("nhận xét có thẻ HTML hiện dạng văn bản; nội dung dài rút gọn có xem đầy đủ", async () => {
    const html = '<img src=x onerror=alert(1)><b>đậm</b>' + "x".repeat(200);
    svc.list.mockResolvedValue(page([review({ comment: html })]));
    const { container } = render(<ReviewList />);
    await screen.findAllByText("Nguyễn Văn A");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(screen.getAllByText(/<img src=x onerror=alert\(1\)><b>đậm<\/b>/)[0]).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Xem đầy đủ" })[0]);
    expect(screen.getAllByText(html)[0]).toBeInTheDocument();
  });
  it("tên, SĐT, liên kết sản phẩm công khai", async () => {
    svc.list.mockResolvedValue(page([review()]));
    render(<ReviewList />);
    await screen.findAllByText("Nguyễn Văn A");
    expect(screen.getAllByText("0901234567", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Nhẫn vàng/ })[0]).toHaveAttribute("href", "/products/nhan-vang");
  });
  it("loading, empty và error có thử lại", async () => {
    svc.list.mockReturnValue(new Promise(() => {}));
    render(<ReviewList />);
    expect(screen.getByLabelText("Đang tải")).toBeInTheDocument();
    cleanup();
    svc.list.mockResolvedValue(page([]));
    render(<ReviewList />);
    expect(await screen.findByText("Chưa có đánh giá nào")).toBeInTheDocument();
    cleanup();
    svc.list.mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce(page([review()]));
    render(<ReviewList />);
    fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
    expect((await screen.findAllByText("Nguyễn Văn A")).length).toBeGreaterThan(0);
  });
});
