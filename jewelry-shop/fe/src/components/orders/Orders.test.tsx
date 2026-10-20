import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderDetail, OrderListItem } from "@/types/order";
import { ApiError } from "@/utils/errors";

const m = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  cancel: vi.fn(),
  confirmWithReason: vi.fn(),
  notify: vi.fn(),
  copy: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ code: "LG20261017-483920" }),
  useSearchParams: () => new URLSearchParams(m.search),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/services/order.service", () => ({
  orderService: {
    list: (...a: unknown[]) => m.list(...a),
    get: (...a: unknown[]) => m.get(...a),
    cancel: (...a: unknown[]) => m.cancel(...a),
  },
}));
vi.mock("@/utils/confirm", () => ({ confirmWithReason: (...a: unknown[]) => m.confirmWithReason(...a) }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));
vi.mock("@/utils/clipboard", () => ({ copyText: (...a: unknown[]) => m.copy(...a) }));

import { OrderDetailView } from "./OrderDetailView";
import { OrdersView } from "./OrdersView";

const listItem = (code: string, status: OrderListItem["status"]): OrderListItem => ({
  code,
  createdAt: "2026-10-17T07:00:00.000Z",
  status,
  paymentMethod: "cod",
  paymentStatus: "unpaid",
  total: 2_030_000,
  itemCount: 4,
  items: [
    { productName: "Nhẫn A", size: "12", imageUrl: null, quantity: 1 },
    { productName: "Nhẫn B", size: "", imageUrl: null, quantity: 2 },
    { productName: "Nhẫn C", size: "", imageUrl: null, quantity: 1 },
  ],
});
const page = (items: OrderListItem[]) => ({ items, page: 1, pageSize: 10, total: items.length, totalPages: 1 });

const detail = (over: Partial<OrderDetail> = {}): OrderDetail => ({
  code: "LG20261017-483920",
  createdAt: "2026-10-17T07:00:00.000Z",
  status: "pending",
  paymentMethod: "cod",
  paymentStatus: "unpaid",
  paidAt: null,
  cancelReason: null,
  note: null,
  receiver: { name: "Nguyễn Văn A", phone: "0912345678", province: "Hà Nội", ward: "Ba Đình", addressDetail: "12 Nguyễn Trãi" },
  shippingMethodName: "Giao hàng tiêu chuẩn",
  subtotal: 2_000_000,
  shippingFee: 30_000,
  total: 2_030_000,
  items: [{ productName: "Nhẫn A", productCode: "A", productSlug: "nhan-a", size: "12", imageUrl: null, unitPrice: 1_000_000, quantity: 2, lineTotal: 2_000_000 }],
  history: [{ status: "pending", note: "Đặt hàng", createdAt: "2026-10-17T07:00:00.000Z" }],
  paymentInstructions: null,
  ...over,
});

beforeEach(() => {
  Object.values(m).forEach((f) => typeof f === "function" && "mockReset" in f && f.mockReset());
  m.search = "";
});
afterEach(cleanup);

describe("OrdersView", () => {
  it("hiện thẻ đơn: mã, nhãn trạng thái tiếng Việt, tổng tiền, tối đa 3 sản phẩm", async () => {
    m.list.mockResolvedValue(page([listItem("LG1", "shipping")]));
    render(<OrdersView />);
    expect(await screen.findByText("Đơn LG1")).toBeInTheDocument();
    expect(screen.getAllByText("Đang giao hàng").length).toBeGreaterThan(0);
    expect(screen.getByText("Chưa thanh toán")).toBeInTheDocument();
    expect(screen.getByText(/2\.030\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Nhẫn C/)).toBeInTheDocument();
    expect(screen.getByText(/và 1 sản phẩm khác/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Đơn LG1/ })).toHaveAttribute("href", "/user/orders/LG1");
  });
  it("tab lọc theo trạng thái gọi API với status và về trang 1", async () => {
    m.list.mockResolvedValue(page([listItem("LG1", "pending")]));
    render(<OrdersView />);
    await screen.findByText("Đơn LG1");
    expect(m.list.mock.calls[0][0]).toMatchObject({ page: 1, status: undefined });
    m.list.mockResolvedValue(page([listItem("LG2", "cancelled")]));
    fireEvent.click(screen.getByRole("tab", { name: "Đã hủy" }));
    expect(await screen.findByText("Đơn LG2")).toBeInTheDocument();
    expect(m.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, status: "cancelled" }), expect.anything());
    expect(screen.getByRole("tab", { name: "Đã hủy" })).toHaveAttribute("aria-selected", "true");
  });
  it("empty state theo tab", async () => {
    m.list.mockResolvedValue(page([]));
    render(<OrdersView />);
    expect(await screen.findByText("Bạn chưa có đơn hàng nào")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Chờ xác nhận" }));
    expect(await screen.findByText(/Không có đơn "Chờ xác nhận"/)).toBeInTheDocument();
  });
  it("lỗi tải: error state có nút thử lại", async () => {
    m.list.mockRejectedValueOnce(new Error("x"));
    render(<OrdersView />);
    const retry = await screen.findByRole("button", { name: "Thử lại" });
    m.list.mockResolvedValue(page([listItem("LG1", "pending")]));
    fireEvent.click(retry);
    expect(await screen.findByText("Đơn LG1")).toBeInTheDocument();
  });
});

describe("OrderDetailView", () => {
  it("banner thành công khi vừa đặt, timeline từ history", async () => {
    m.search = "placed=1";
    m.get.mockResolvedValue(
      detail({
        status: "confirmed",
        history: [
          { status: "pending", note: "Đặt hàng", createdAt: "2026-10-17T07:00:00.000Z" },
          { status: "confirmed", note: null, createdAt: "2026-10-17T08:00:00.000Z" },
        ],
      }),
    );
    render(<OrderDetailView />);
    expect(await screen.findByText(/Đặt hàng thành công!/)).toBeInTheDocument();
    const timeline = screen.getByRole("list", { name: "Tiến trình đơn hàng" });
    expect(timeline.querySelectorAll("li")).toHaveLength(2);
    expect(timeline.textContent).toContain("Đã xác nhận");
    expect(screen.queryByRole("button", { name: "Hủy đơn" })).toBeNull(); // chỉ hủy được khi pending
  });

  it("có paymentInstructions: hiện khung chuyển khoản và sao chép số tài khoản, nội dung", async () => {
    m.get.mockResolvedValue(
      detail({
        paymentMethod: "bank_transfer",
        paymentInstructions: {
          bankName: "Ngân hàng MẪU", accountNumber: "0123456789", accountHolder: "CONG TY MAU",
          transferContent: "LG20261017-483920", amount: 2_030_000,
        },
      }),
    );
    m.copy.mockResolvedValue(true);
    render(<OrderDetailView />);
    expect(await screen.findByRole("region", { name: "Thông tin chuyển khoản" })).toBeInTheDocument();
    expect(screen.getByText("0123456789")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sao chép số tài khoản" }));
    await waitFor(() => expect(m.copy).toHaveBeenCalledWith("0123456789"));
    expect(m.notify).toHaveBeenCalledWith("success", "Đã sao chép");
    fireEvent.click(screen.getByRole("button", { name: "Sao chép nội dung chuyển khoản" }));
    await waitFor(() => expect(m.copy).toHaveBeenCalledWith("LG20261017-483920"));
  });

  it("không có paymentInstructions thì không hiện khung chuyển khoản", async () => {
    m.get.mockResolvedValue(detail());
    render(<OrderDetailView />);
    await screen.findByText("Đơn LG20261017-483920");
    expect(screen.queryByRole("region", { name: "Thông tin chuyển khoản" })).toBeNull();
  });

  it("hủy đơn: swal hủy thì KHÔNG gọi API; xác nhận kèm lý do thì gọi và cập nhật trạng thái", async () => {
    m.get.mockResolvedValue(detail());
    m.cancel.mockResolvedValue(detail({ status: "cancelled", cancelReason: "Đổi ý", history: [] }));
    render(<OrderDetailView />);
    await screen.findByText("Đơn LG20261017-483920");
    m.confirmWithReason.mockResolvedValueOnce({ confirmed: false, reason: "" });
    fireEvent.click(screen.getByRole("button", { name: "Hủy đơn" }));
    await waitFor(() => expect(m.confirmWithReason).toHaveBeenCalledTimes(1));
    expect(m.cancel).not.toHaveBeenCalled();
    m.confirmWithReason.mockResolvedValueOnce({ confirmed: true, reason: "Đổi ý" });
    fireEvent.click(screen.getByRole("button", { name: "Hủy đơn" }));
    await waitFor(() => expect(m.cancel).toHaveBeenCalledWith("LG20261017-483920", "Đổi ý"));
    expect(m.notify).toHaveBeenCalledWith("success", "Đã hủy đơn hàng");
    expect(await screen.findByText(/Lý do hủy: Đổi ý/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hủy đơn" })).toBeNull();
  });

  it("ORDER_NOT_CANCELLABLE: toast và tải lại đơn", async () => {
    m.get.mockResolvedValue(detail());
    m.cancel.mockRejectedValue(new ApiError(409, "ORDER_NOT_CANCELLABLE", "x"));
    m.confirmWithReason.mockResolvedValue({ confirmed: true, reason: "" });
    render(<OrderDetailView />);
    await screen.findByText("Đơn LG20261017-483920");
    m.get.mockResolvedValue(detail({ status: "confirmed" }));
    fireEvent.click(screen.getByRole("button", { name: "Hủy đơn" }));
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", expect.stringContaining("không còn ở trạng thái")));
    await waitFor(() => expect(m.get).toHaveBeenCalledTimes(2));
    expect(m.cancel).toHaveBeenCalledWith("LG20261017-483920", undefined);
  });

  it("đơn delivered: nút Đánh giá dẫn tới #reviews của sản phẩm; chỉ hiện khi có productSlug", async () => {
    m.get.mockResolvedValue(
      detail({
        status: "delivered",
        items: [
          { productName: "Nhẫn A", productCode: "A", productSlug: "nhan-a", size: "12", imageUrl: null, unitPrice: 1, quantity: 1, lineTotal: 1 },
          { productName: "Nhẫn B", productCode: "B", productSlug: null, size: "", imageUrl: null, unitPrice: 1, quantity: 1, lineTotal: 1 },
        ],
      } as never),
    );
    render(<OrderDetailView />);
    const link = await screen.findByRole("link", { name: "Đánh giá" });
    expect(link).toHaveAttribute("href", "/products/nhan-a#reviews");
    expect(screen.getAllByRole("link", { name: "Đánh giá" })).toHaveLength(1);
  });
  it("đơn chưa giao: không có nút Đánh giá", async () => {
    m.get.mockResolvedValue(detail({ status: "shipping" }));
    render(<OrderDetailView />);
    await screen.findByText(/Nhẫn A/);
    expect(screen.queryByRole("link", { name: /Đánh giá/ })).toBeNull();
  });
  it("không tìm thấy đơn (null) thì hiện empty state", async () => {
    m.get.mockResolvedValue(null);
    render(<OrderDetailView />);
    expect(await screen.findByText("Không tìm thấy đơn hàng")).toBeInTheDocument();
  });
});
