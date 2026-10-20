import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderPreview } from "@/types/order";
import { ApiError } from "@/utils/errors";

const m = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  preview: vi.fn(),
  create: vi.fn(),
  addresses: vi.fn(),
  shipping: vi.fn(),
  notify: vi.fn(),
  dropCartItems: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: m.replace, push: m.push }) }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/services/order.service", () => ({
  orderService: { preview: (...a: unknown[]) => m.preview(...a), create: (...a: unknown[]) => m.create(...a) },
}));
vi.mock("@/services/address.service", () => ({ addressService: { list: () => m.addresses() } }));
vi.mock("@/services/shipping.service", () => ({ shippingService: { list: () => m.shipping() } }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));
vi.mock("@/store/cart-store", () => ({ dropCartItems: (...a: unknown[]) => m.dropCartItems(...a) }));
vi.mock("@/components/user/AddressForm", () => ({ AddressForm: () => <div role="dialog">form địa chỉ</div> }));

import { setCheckoutItems } from "@/store/checkout-store";
import { CheckoutView } from "./CheckoutView";

const preview = (over: Partial<OrderPreview> = {}): OrderPreview => ({
  items: [
    {
      cartItemId: 1, variantId: 10, productId: 3, productName: "Nhẫn A", productSlug: "nhan-a", productCode: "A",
      size: "12", imageUrl: null, unitPrice: 1_000_000, quantity: 2, lineTotal: 2_000_000,
    },
  ],
  subtotal: 2_000_000,
  shippingFee: 30_000,
  total: 2_030_000,
  issues: [],
  ...over,
});

const addr = (id: number, isDefault = false) => ({
  id, receiverName: `Người ${id}`, receiverPhone: "0912345678", provinceId: 1, provinceName: "Hà Nội",
  wardId: 1, wardName: "Ba Đình", detail: "12 Nguyễn Trãi", isDefault,
});
const methods = [
  { id: 1, name: "Giao hàng tiêu chuẩn", description: null, fee: 30_000 },
  { id: 2, name: "Giao hàng nhanh", description: null, fee: 60_000 },
];

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  sessionStorage.clear();
  setCheckoutItems([1]);
  m.addresses.mockResolvedValue([addr(1), addr(2, true)]);
  m.shipping.mockResolvedValue(methods);
  m.preview.mockResolvedValue(preview());
});
afterEach(cleanup);

const orderBtn = () => screen.getByRole("button", { name: /Đặt hàng/ });
const ready = async () => {
  await screen.findByText("Nhẫn A");
  await waitFor(() => expect(orderBtn()).toBeEnabled());
};

describe("CheckoutView", () => {
  it("không có dòng đã chọn thì về /cart", async () => {
    sessionStorage.clear();
    render(<CheckoutView />);
    await waitFor(() => expect(m.replace).toHaveBeenCalledWith("/cart"));
  });

  it("hiện preview từ API, chọn sẵn địa chỉ mặc định và phương thức vận chuyển đầu tiên", async () => {
    render(<CheckoutView />);
    await ready();
    expect(m.preview).toHaveBeenCalledWith([1], 1, expect.anything());
    expect(screen.getByTestId("subtotal").textContent).toMatch(/2\.000\.000/);
    expect(screen.getByTestId("shipping-fee").textContent).toMatch(/30\.000/);
    expect(screen.getByTestId("total").textContent).toMatch(/2\.030\.000/);
    expect(screen.getByLabelText(/Người 2/)).toBeChecked();
    expect(screen.getByLabelText(/Giao hàng tiêu chuẩn/)).toBeChecked();
  });

  it("đổi vận chuyển thì gọi lại preview và hiện tổng mới từ API", async () => {
    render(<CheckoutView />);
    await ready();
    m.preview.mockResolvedValue(preview({ shippingFee: 60_000, total: 2_060_000 }));
    fireEvent.click(screen.getByLabelText(/Giao hàng nhanh/));
    await waitFor(() => expect(m.preview).toHaveBeenLastCalledWith([1], 2, expect.anything()));
    await waitFor(() => expect(screen.getByTestId("total").textContent).toMatch(/2\.060\.000/));
  });

  it("chưa có địa chỉ: chặn đặt hàng, hướng dẫn thêm và có lối thêm địa chỉ", async () => {
    m.addresses.mockResolvedValue([]);
    render(<CheckoutView />);
    await screen.findByText(/chưa có địa chỉ nhận hàng/i);
    await screen.findByText("Nhẫn A");
    expect(orderBtn()).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button", { name: "Thêm địa chỉ" })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dòng có vấn đề: khóa đặt hàng", async () => {
    m.preview.mockResolvedValue(preview({ issues: [{ cartItemId: 1, issue: "INSUFFICIENT_STOCK", available: 1 }] }));
    render(<CheckoutView />);
    await screen.findByText(/Không đủ tồn kho/);
    expect(orderBtn()).toBeDisabled();
  });

  it("đặt hàng thành công: gửi expectedTotal + Idempotency-Key, dọn dẹp và chuyển tới đơn", async () => {
    m.create.mockResolvedValue({ code: "LG20261017-483920" });
    render(<CheckoutView />);
    await ready();
    fireEvent.change(screen.getByLabelText("Ghi chú cho đơn hàng"), { target: { value: "Giao giờ hành chính" } });
    expect(screen.getByText("19/500")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Chuyển khoản ngân hàng/));
    fireEvent.click(orderBtn());
    await waitFor(() => expect(m.create).toHaveBeenCalledTimes(1));
    const [body, key] = m.create.mock.calls[0];
    expect(body).toEqual({
      itemIds: [1], addressId: 2, shippingMethodId: 1, paymentMethod: "bank_transfer",
      note: "Giao giờ hành chính", expectedTotal: 2_030_000,
    });
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(m.replace).toHaveBeenCalledWith("/user/orders/LG20261017-483920?placed=1"));
    expect(m.dropCartItems).toHaveBeenCalledWith([1]);
    expect(sessionStorage.getItem("checkout.itemIds")).toBeNull();
    expect(m.notify).toHaveBeenCalledWith("success", "Đặt hàng thành công");
    expect(m.replace).not.toHaveBeenCalledWith("/cart");
  });

  it("khóa khi đang gửi: bấm liên tiếp chỉ gửi một request", async () => {
    let resolve!: (v: unknown) => void;
    m.create.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<CheckoutView />);
    await ready();
    const btn = orderBtn();
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(m.create).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Đang đặt hàng/ })).toBeDisabled();
    resolve({ code: "X" });
    await waitFor(() => expect(m.replace).toHaveBeenCalled());
  });

  it("lỗi khác: dùng lại CÙNG Idempotency-Key khi bấm đặt lại", async () => {
    m.create.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "mạng"));
    m.create.mockResolvedValueOnce({ code: "X" });
    render(<CheckoutView />);
    await ready();
    fireEvent.click(orderBtn());
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", "mạng"));
    await waitFor(() => expect(orderBtn()).toBeEnabled());
    fireEvent.click(orderBtn());
    await waitFor(() => expect(m.create).toHaveBeenCalledTimes(2));
    expect(m.create.mock.calls[1][1]).toBe(m.create.mock.calls[0][1]);
  });

  it("PRICE_CHANGED: tải lại preview, toast tổng mới, đổi Idempotency-Key, yêu cầu bấm đặt lại", async () => {
    m.create.mockRejectedValueOnce(
      new ApiError(409, "PRICE_CHANGED", "đổi giá", [], undefined, undefined, { total: 2_100_000, subtotal: 2_070_000, shippingFee: 30_000 }),
    );
    render(<CheckoutView />);
    await ready();
    m.preview.mockResolvedValue(preview({ subtotal: 2_070_000, total: 2_100_000 }));
    fireEvent.click(orderBtn());
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("warning", expect.stringMatching(/2\.100\.000.*Đặt hàng lại/)));
    await waitFor(() => expect(screen.getByTestId("total").textContent).toMatch(/2\.100\.000/));
    expect(m.replace).not.toHaveBeenCalled();
    m.create.mockResolvedValueOnce({ code: "X" });
    await waitFor(() => expect(orderBtn()).toBeEnabled());
    fireEvent.click(orderBtn());
    await waitFor(() => expect(m.create).toHaveBeenCalledTimes(2));
    expect(m.create.mock.calls[1][0].expectedTotal).toBe(2_100_000);
    expect(m.create.mock.calls[1][1]).not.toBe(m.create.mock.calls[0][1]);
  });

  it("INSUFFICIENT_STOCK: toast liệt kê sản phẩm thiếu và dẫn về /cart", async () => {
    m.create.mockRejectedValue(
      new ApiError(409, "INSUFFICIENT_STOCK", "x", [], undefined, undefined, {
        shortages: [{ variantId: 10, productName: "Nhẫn A", size: "12", available: 1, requested: 2 }],
      }),
    );
    render(<CheckoutView />);
    await ready();
    fireEvent.click(orderBtn());
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", expect.stringMatching(/Nhẫn A.*size 12.*còn 1/)));
    expect(m.push).toHaveBeenCalledWith("/cart");
  });

  it("ITEM_UNAVAILABLE: toast và dẫn về /cart", async () => {
    m.create.mockRejectedValue(new ApiError(409, "ITEM_UNAVAILABLE", "x"));
    render(<CheckoutView />);
    await ready();
    fireEvent.click(orderBtn());
    await waitFor(() => expect(m.push).toHaveBeenCalledWith("/cart"));
    expect(m.notify).toHaveBeenCalledWith("error", expect.stringContaining("ngừng bán"));
  });

  it("REQUEST_IN_PROGRESS: toast đang xử lý, không chuyển trang, giữ nguyên key", async () => {
    m.create.mockRejectedValueOnce(new ApiError(409, "REQUEST_IN_PROGRESS", "x"));
    render(<CheckoutView />);
    await ready();
    fireEvent.click(orderBtn());
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("info", expect.stringContaining("đang được xử lý")));
    expect(m.replace).not.toHaveBeenCalled();
    expect(m.push).not.toHaveBeenCalled();
    m.create.mockResolvedValueOnce({ code: "X" });
    await waitFor(() => expect(orderBtn()).toBeEnabled());
    fireEvent.click(orderBtn());
    await waitFor(() => expect(m.create).toHaveBeenCalledTimes(2));
    expect(m.create.mock.calls[1][1]).toBe(m.create.mock.calls[0][1]);
  });
});
