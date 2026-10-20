import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MyReviewState, ReviewPage } from "@/types/review";
import { ApiError } from "@/utils/errors";

const m = vi.hoisted(() => ({
  list: vi.fn(),
  myReview: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
  notify: vi.fn(),
  auth: { status: "authenticated" as "authenticated" | "unauthenticated" | "loading" },
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/store/auth-context", () => ({ useAuth: () => ({ status: m.auth.status }) }));
vi.mock("@/services/review.service", () => ({
  reviewService: {
    list: (...a: unknown[]) => m.list(...a),
    myReview: (...a: unknown[]) => m.myReview(...a),
    create: (...a: unknown[]) => m.create(...a),
    update: (...a: unknown[]) => m.update(...a),
    remove: (...a: unknown[]) => m.remove(...a),
  },
}));
vi.mock("@/utils/confirm", () => ({ confirmAction: (...a: unknown[]) => m.confirm(...a) }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));

import { resetRatingOverrides } from "@/store/review-summary-store";
import { LiveRating, ReviewSection } from "./ReviewSection";

const page = (over: Partial<ReviewPage> = {}): ReviewPage => ({
  summary: { avgRating: 4.5, reviewCount: 12, distribution: { "1": 0, "2": 1, "3": 1, "4": 3, "5": 7 } },
  items: [
    { id: 1, rating: 5, comment: "Rất đẹp\nGiao nhanh", reviewerName: "Trần T. D.", createdAt: "2026-10-17T02:57:29.000Z", updatedAt: "2026-10-17T02:57:29.000Z", isMine: false },
  ],
  page: 1,
  pageSize: 10,
  total: 12,
  totalPages: 2,
  ...over,
});
const mine = (over: Partial<MyReviewState> = {}): MyReviewState => ({ eligible: true, reason: null, review: null, ...over });
const myReview = (over = {}) => ({ id: 9, rating: 4, comment: "Ổn", isHidden: false, createdAt: "2026-10-17T02:57:29.000Z", updatedAt: "2026-10-17T02:57:29.000Z", ...over });

const renderSection = () =>
  render(
    <>
      <LiveRating productId={3} avgRating={4.5} reviewCount={12} />
      <ReviewSection productId={3} slug="nhan-a" avgRating={4.5} reviewCount={12} />
    </>,
  );

beforeEach(() => {
  Object.values(m).forEach((f) => typeof f === "function" && "mockReset" in f && f.mockReset());
  m.auth.status = "authenticated";
  m.list.mockResolvedValue(page());
  m.myReview.mockResolvedValue(mine());
  resetRatingOverrides();
});
afterEach(cleanup);

describe("tóm tắt và danh sách", () => {
  it("điểm trung bình, số lượt, phân bố 5..1 sao và danh sách (tên che bớt, xuống dòng)", async () => {
    renderSection();
    expect(await screen.findByText("Trần T. D.")).toBeInTheDocument();
    expect(screen.getByTestId("avg-rating")).toHaveTextContent("4.5");
    expect(screen.getByTestId("review-count")).toHaveTextContent("12 đánh giá");
    const dist = within(screen.getByRole("list", { name: "Phân bố số sao" }));
    expect(dist.getAllByRole("listitem")).toHaveLength(5);
    expect(dist.getByText("5 sao").parentElement).toHaveTextContent("7");
    expect(screen.getByText(/Rất đẹp/)).toHaveClass("whitespace-pre-line");
  });

  it("nhận xét chứa <script> hiển thị dạng văn bản, không tạo phần tử", async () => {
    m.list.mockResolvedValue(
      page({ items: [{ ...page().items[0], comment: '<script>alert(1)</script><img src=x onerror=alert(2)>' }] }),
    );
    const { container } = renderSection();
    expect(await screen.findByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("lọc theo số sao gọi API với rating và về trang 1", async () => {
    renderSection();
    await screen.findByText("Trần T. D.");
    fireEvent.click(screen.getByRole("button", { name: "4 sao" }));
    await waitFor(() => expect(m.list).toHaveBeenLastCalledWith("nhan-a", { page: 1, pageSize: 10, rating: 4 }, expect.anything()));
    expect(screen.getByRole("button", { name: "4 sao" })).toHaveAttribute("aria-pressed", "true");
  });

  it("empty state khi lọc không có kết quả", async () => {
    renderSection();
    await screen.findByText("Trần T. D.");
    m.list.mockResolvedValue(page({ items: [], total: 0, totalPages: 0 }));
    fireEvent.click(screen.getByRole("button", { name: "1 sao" }));
    expect(await screen.findByText("Chưa có đánh giá 1 sao")).toBeInTheDocument();
  });

  it("lỗi tải: error state có nút thử lại", async () => {
    m.list.mockRejectedValueOnce(new Error("x"));
    renderSection();
    const retry = await screen.findByRole("button", { name: "Thử lại" });
    fireEvent.click(retry);
    expect(await screen.findByText("Trần T. D.")).toBeInTheDocument();
  });
});

describe("khung viết đánh giá", () => {
  it("chưa đăng nhập: nút đăng nhập kèm ?redirect= về trang sản phẩm, không gọi my-review", async () => {
    m.auth.status = "unauthenticated";
    renderSection();
    const link = await screen.findByRole("link", { name: "Đăng nhập" });
    expect(link).toHaveAttribute("href", "/login?redirect=%2Fproducts%2Fnhan-a%23reviews");
    expect(m.myReview).not.toHaveBeenCalled();
  });

  it("NOT_PURCHASED: thông báo chỉ khách đã mua", async () => {
    m.myReview.mockResolvedValue(mine({ eligible: false, reason: "NOT_PURCHASED" }));
    renderSection();
    expect(await screen.findByText(/Chỉ khách đã mua và nhận hàng mới có thể đánh giá/)).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Viết đánh giá" })).toBeNull();
  });

  it("eligible: validate (chưa chọn sao, nhận xét > 1000), không gọi API", async () => {
    renderSection();
    await screen.findByRole("form", { name: "Viết đánh giá" });
    fireEvent.click(screen.getByRole("button", { name: "Gửi đánh giá" }));
    expect(await screen.findByText("Vui lòng chọn số sao từ 1 đến 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "5 sao" }));
    fireEvent.change(screen.getByLabelText(/Nhận xét/), { target: { value: "a".repeat(1001) } });
    expect(screen.getByText("1001/1000")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gửi đánh giá" }));
    expect(await screen.findByText("Nhận xét tối đa 1000 ký tự")).toBeInTheDocument();
    expect(m.create).not.toHaveBeenCalled();
  });

  it("tạo đánh giá: gọi API, toast, tải lại danh sách và cập nhật điểm ở đầu trang", async () => {
    m.create.mockResolvedValue(myReview());
    renderSection();
    await screen.findByRole("form", { name: "Viết đánh giá" });
    expect(screen.getByText("(12)")).toBeInTheDocument();
    m.list.mockResolvedValue(page({ summary: { avgRating: 4.6, reviewCount: 13, distribution: { "1": 0, "2": 1, "3": 1, "4": 3, "5": 8 } } }));
    m.myReview.mockResolvedValue(mine({ eligible: false, reason: "ALREADY_REVIEWED", review: myReview({ rating: 5, comment: "Tuyệt" }) }));
    fireEvent.click(screen.getByRole("radio", { name: "5 sao" }));
    fireEvent.change(screen.getByLabelText(/Nhận xét/), { target: { value: "  Tuyệt  " } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi đánh giá" }));
    await waitFor(() => expect(m.create).toHaveBeenCalledWith("nhan-a", { rating: 5, comment: "Tuyệt" }));
    expect(m.notify).toHaveBeenCalledWith("success", expect.stringContaining("Cảm ơn"));
    expect(await screen.findByLabelText("Đánh giá của bạn")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("(13)")).toBeInTheDocument());
    expect(screen.getByTestId("review-count")).toHaveTextContent("13 đánh giá");
  });

  it("REVIEW_ALREADY_EXISTS: toast tiếng Việt và tải lại trạng thái khung viết", async () => {
    m.create.mockRejectedValue(new ApiError(409, "REVIEW_ALREADY_EXISTS", "x"));
    renderSection();
    await screen.findByRole("form", { name: "Viết đánh giá" });
    m.myReview.mockResolvedValue(mine({ eligible: false, reason: "ALREADY_REVIEWED", review: myReview() }));
    fireEvent.click(screen.getByRole("radio", { name: "4 sao" }));
    fireEvent.click(screen.getByRole("button", { name: "Gửi đánh giá" }));
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", "Bạn đã đánh giá sản phẩm này rồi"));
    expect(await screen.findByLabelText("Đánh giá của bạn")).toBeInTheDocument();
  });

  it("REVIEW_NOT_ALLOWED: toast riêng", async () => {
    m.create.mockRejectedValue(new ApiError(403, "REVIEW_NOT_ALLOWED", "x"));
    renderSection();
    await screen.findByRole("form", { name: "Viết đánh giá" });
    m.myReview.mockResolvedValue(mine({ eligible: false, reason: "NOT_PURCHASED" }));
    fireEvent.click(screen.getByRole("radio", { name: "4 sao" }));
    fireEvent.click(screen.getByRole("button", { name: "Gửi đánh giá" }));
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", expect.stringContaining("đã mua và nhận hàng")));
  });

  it("đã có đánh giá: Sửa mở form có sẵn giá trị và gọi update; REVIEW_HIDDEN báo toast", async () => {
    m.myReview.mockResolvedValue(mine({ eligible: false, reason: "ALREADY_REVIEWED", review: myReview() }));
    renderSection();
    fireEvent.click(await screen.findByRole("button", { name: "Sửa" }));
    expect(screen.getByRole("radio", { name: "4 sao" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText(/Nhận xét/)).toHaveValue("Ổn");
    m.update.mockRejectedValueOnce(new ApiError(403, "REVIEW_HIDDEN", "x"));
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(m.update).toHaveBeenCalledWith(9, { rating: 4, comment: "Ổn" }));
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", expect.stringContaining("bị ẩn bởi quản trị viên")));
  });

  it("đánh giá bị ẩn: có nhãn và khóa nút Sửa", async () => {
    m.myReview.mockResolvedValue(mine({ eligible: false, reason: "ALREADY_REVIEWED", review: myReview({ isHidden: true }) }));
    renderSection();
    expect(await screen.findByText("Đánh giá của bạn đang bị ẩn bởi quản trị viên")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sửa" })).toBeDisabled();
  });

  it("xóa: hủy swal không gọi API; xác nhận thì xóa, toast và tải lại danh sách", async () => {
    m.myReview.mockResolvedValue(mine({ eligible: false, reason: "ALREADY_REVIEWED", review: myReview() }));
    m.remove.mockResolvedValue(undefined);
    renderSection();
    const del = await screen.findByRole("button", { name: "Xóa" });
    m.confirm.mockResolvedValueOnce(false);
    fireEvent.click(del);
    await waitFor(() => expect(m.confirm).toHaveBeenCalledTimes(1));
    expect(m.confirm.mock.calls[0][0]).toMatchObject({ tone: "danger" });
    expect(m.remove).not.toHaveBeenCalled();
    m.confirm.mockResolvedValueOnce(true);
    const lists = m.list.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
    await waitFor(() => expect(m.remove).toHaveBeenCalledWith(9));
    expect(m.notify).toHaveBeenCalledWith("success", "Đã xóa đánh giá");
    await waitFor(() => expect(m.list.mock.calls.length).toBeGreaterThan(lists));
  });
});
