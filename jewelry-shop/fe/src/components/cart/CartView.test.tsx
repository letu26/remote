import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Cart, CartItem } from "@/types/shop";

const m = vi.hoisted(() => ({
  get: vi.fn(),
  setQuantity: vi.fn(),
  removeItem: vi.fn(),
  removeItems: vi.fn(),
  confirm: vi.fn(),
  notify: vi.fn(),
}));

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("@/services/cart.service", () => ({
  cartService: {
    get: () => m.get(),
    setQuantity: (...a: unknown[]) => m.setQuantity(...a),
    removeItem: (...a: unknown[]) => m.removeItem(...a),
    removeItems: (...a: unknown[]) => m.removeItems(...a),
  },
}));
vi.mock("@/utils/confirm", () => ({ confirmAction: (...a: unknown[]) => m.confirm(...a) }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));

import { setToken } from "@/store/token-store";
import { QUANTITY_DEBOUNCE_MS, resetCart } from "@/store/cart-store";
import { CartView } from "./CartView";

const line = (id: number, over: Partial<CartItem> = {}): CartItem => ({
  id,
  variantId: id * 10,
  productId: id,
  productCode: `P${id}`,
  productName: `Nhẫn ${id}`,
  productSlug: `nhan-${id}`,
  size: "12",
  imageUrl: null,
  price: 1_000_000,
  salePrice: null,
  discountPercent: null,
  unitPrice: 1_000_000,
  quantity: 2,
  lineTotal: 2_000_000,
  stock: 5,
  available: true,
  issue: null,
  ...over,
});
const cartOf = (...items: CartItem[]): Cart => ({
  items,
  subtotal: 0,
  itemCount: items.length,
  totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
  hasIssues: items.some((i) => i.issue),
});

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  push.mockReset();
  sessionStorage.clear();
  setToken("tok");
  resetCart();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CartView", () => {
  it("giỏ rỗng: empty state có nút tiếp tục mua sắm", async () => {
    m.get.mockResolvedValue(cartOf());
    render(<CartView />);
    expect(await screen.findByText("Giỏ hàng của bạn đang trống")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tiếp tục mua sắm" })).toHaveAttribute("href", "/products");
  });

  it("lỗi tải: error state có nút thử lại", async () => {
    m.get.mockRejectedValueOnce(new Error("x"));
    render(<CartView />);
    const retry = await screen.findByRole("button", { name: "Thử lại" });
    m.get.mockResolvedValue(cartOf(line(1)));
    fireEvent.click(retry);
    expect(await screen.findByText("Nhẫn 1")).toBeInTheDocument();
  });

  it("chọn tất cả bỏ qua dòng có vấn đề (làm mờ, có nhãn, không chọn được); tổng lấy từ lineTotal", async () => {
    m.get.mockResolvedValue(
      cartOf(
        line(1),
        line(2, { lineTotal: 3_000_000 }),
        line(3, { issue: "OUT_OF_STOCK", available: false, stock: 0, lineTotal: 9_000_000 }),
      ),
    );
    render(<CartView />);
    await screen.findByText("Nhẫn 1");
    expect(screen.getByLabelText(/Chọn Nhẫn 3/)).toBeDisabled();
    expect(screen.getByText("Hết hàng")).toBeInTheDocument();
    expect(screen.getByTestId("selected-total")).toHaveTextContent("0");
    fireEvent.click(screen.getByLabelText(/Chọn tất cả/));
    expect(screen.getByTestId("selected-total").textContent).toMatch(/5\.000\.000/);
    fireEvent.click(screen.getByLabelText(/Chọn Nhẫn 2/));
    expect(screen.getByTestId("selected-total").textContent).toMatch(/2\.000\.000/);
    expect(screen.getByText(/Phí vận chuyển: tính ở bước thanh toán/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thanh toán" })).toBeEnabled();
  });

  it("Thanh toán: khóa khi chưa chọn dòng nào; chọn xong lưu các dòng đã chọn và chuyển /checkout", async () => {
    m.get.mockResolvedValue(
      cartOf(line(1), line(2), line(3, { issue: "OUT_OF_STOCK", available: false, stock: 0 })),
    );
    render(<CartView />);
    await screen.findByText("Nhẫn 1");
    const pay = screen.getByRole("button", { name: "Thanh toán" });
    expect(pay).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Chọn tất cả/));
    expect(pay).toBeEnabled();
    fireEvent.click(pay);
    expect(JSON.parse(sessionStorage.getItem("checkout.itemIds")!)).toEqual([1, 2]);
    expect(push).toHaveBeenCalledWith("/checkout");
  });

  it("xóa một dòng: hủy swal thì không gọi API, xác nhận thì gọi và báo toast", async () => {
    m.get.mockResolvedValue(cartOf(line(1), line(2)));
    m.removeItem.mockResolvedValue(cartOf(line(2)));
    render(<CartView />);
    await screen.findByText("Nhẫn 1");
    m.confirm.mockResolvedValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Xóa Nhẫn 1 khỏi giỏ hàng" }));
    await waitFor(() => expect(m.confirm).toHaveBeenCalledTimes(1));
    expect(m.confirm.mock.calls[0][0]).toMatchObject({ tone: "danger" });
    expect(m.removeItem).not.toHaveBeenCalled();
    m.confirm.mockResolvedValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Xóa Nhẫn 1 khỏi giỏ hàng" }));
    await waitFor(() => expect(m.removeItem).toHaveBeenCalledWith(1));
    expect(m.notify).toHaveBeenCalledWith("success", "Đã xóa sản phẩm khỏi giỏ hàng");
    await waitFor(() => expect(screen.queryByText("Nhẫn 1")).toBeNull());
  });

  it("xóa các dòng đã chọn dùng endpoint xóa nhiều", async () => {
    m.get.mockResolvedValue(cartOf(line(1), line(2)));
    m.removeItems.mockResolvedValue(cartOf());
    m.confirm.mockResolvedValue(true);
    render(<CartView />);
    await screen.findByText("Nhẫn 1");
    fireEvent.click(screen.getByLabelText(/Chọn tất cả/));
    fireEvent.click(screen.getByRole("button", { name: /Xóa đã chọn/ }));
    await waitFor(() => expect(m.removeItems).toHaveBeenCalledWith([1, 2]));
  });

  it("tăng số lượng: hiện ngay, nhiều lần bấm gộp thành một request, không vượt min(10, tồn)", async () => {
    m.get.mockResolvedValue(cartOf(line(1, { quantity: 3, stock: 5 })));
    m.setQuantity.mockResolvedValue(cartOf(line(1, { quantity: 5, lineTotal: 5_000_000, stock: 5 })));
    render(<CartView />);
    await screen.findByText("Nhẫn 1");
    vi.useFakeTimers();
    const inc = screen.getByRole("button", { name: "Tăng số lượng Nhẫn 1" });
    fireEvent.click(inc);
    fireEvent.click(inc);
    fireEvent.click(inc); // đã chạm tồn kho 5 nên nút bị khóa, lần này không có tác dụng
    expect(screen.getByRole("button", { name: "Tăng số lượng Nhẫn 1" })).toBeDisabled();
    expect(m.setQuantity).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUANTITY_DEBOUNCE_MS + 20);
    });
    expect(m.setQuantity).toHaveBeenCalledTimes(1);
    expect(m.setQuantity).toHaveBeenCalledWith(1, 5);
    expect(within(screen.getByRole("list")).getByText("5")).toBeInTheDocument();
  });

  it("nút giảm khóa ở 1", async () => {
    m.get.mockResolvedValue(cartOf(line(1, { quantity: 1 })));
    render(<CartView />);
    await screen.findByText("Nhẫn 1");
    expect(screen.getByRole("button", { name: "Giảm số lượng Nhẫn 1" })).toBeDisabled();
  });
});
