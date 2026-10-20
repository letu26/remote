import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Cart, CartItem } from "@/types/shop";
import { ApiError } from "@/utils/errors";

const { svc, notifyMock } = vi.hoisted(() => ({
  svc: {
    get: vi.fn(),
    summary: vi.fn(),
    addItem: vi.fn(),
    setQuantity: vi.fn(),
    removeItem: vi.fn(),
    removeItems: vi.fn(),
  },
  notifyMock: vi.fn(),
}));
vi.mock("@/services/cart.service", () => ({ cartService: svc }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => notifyMock(...a) }));

import { clearToken, setToken } from "./token-store";
import {
  QUANTITY_DEBOUNCE_MS,
  addToCart,
  applyServerCart,
  changeQuantity,
  getCartState,
  loadCartSummary,
  removeCartItems,
  resetCart,
} from "./cart-store";

const line = (id: number, quantity: number): CartItem => ({
  id,
  variantId: id * 10,
  productId: id,
  productCode: "P",
  productName: "SP",
  productSlug: "sp",
  size: "",
  imageUrl: null,
  price: 1000,
  salePrice: null,
  discountPercent: null,
  unitPrice: 1000,
  quantity,
  lineTotal: 1000 * quantity,
  stock: 10,
  available: true,
  issue: null,
});
const cartOf = (...items: CartItem[]): Cart => ({
  items,
  subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
  itemCount: items.length,
  totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
  hasIssues: false,
});

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  setToken("tok");
  Object.values(svc).forEach((f) => f.mockReset());
  notifyMock.mockReset();
  resetCart();
});
afterEach(() => vi.useRealTimers());

describe("cart-store", () => {
  it("tải số lượng cho header", async () => {
    svc.summary.mockResolvedValue({ itemCount: 2, totalQuantity: 5 });
    await loadCartSummary();
    expect(getCartState().summary).toEqual({ itemCount: 2, totalQuantity: 5 });
  });
  it("không gọi API khi chưa đăng nhập", async () => {
    clearToken();
    await loadCartSummary();
    expect(svc.summary).not.toHaveBeenCalled();
  });
  it("thêm vào giỏ cập nhật giỏ và số lượng ngay từ phản hồi", async () => {
    svc.addItem.mockResolvedValue(cartOf(line(1, 3)));
    await addToCart(10, 3);
    expect(svc.addItem).toHaveBeenCalledWith(10, 3);
    expect(getCartState().summary?.totalQuantity).toBe(3);
  });
  it("thêm lỗi INSUFFICIENT_STOCK: ném lỗi và giữ nguyên giỏ", async () => {
    applyServerCart(cartOf(line(1, 2)));
    svc.addItem.mockRejectedValue(new ApiError(409, "INSUFFICIENT_STOCK", "x", [], undefined, undefined, { available: 3, inCart: 2 }));
    await expect(addToCart(10, 5)).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
    expect(getCartState().cart?.items[0].quantity).toBe(2);
  });
  it("đổi số lượng: cập nhật ngay, nhiều lần bấm chỉ gửi một request", async () => {
    applyServerCart(cartOf(line(1, 2)));
    svc.setQuantity.mockResolvedValue(cartOf(line(1, 5)));
    changeQuantity(1, 3);
    changeQuantity(1, 4);
    changeQuantity(1, 5);
    expect(getCartState().cart?.items[0].quantity).toBe(5); // lạc quan, chưa chờ server
    expect(svc.setQuantity).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(QUANTITY_DEBOUNCE_MS + 10);
    expect(svc.setQuantity).toHaveBeenCalledTimes(1);
    expect(svc.setQuantity).toHaveBeenCalledWith(1, 5);
    expect(getCartState().cart?.items[0].quantity).toBe(5);
  });
  it("giữ số lượng người dùng vừa chỉnh khi nhận giỏ từ request khác (không nhấp nháy)", async () => {
    applyServerCart(cartOf(line(1, 2), line(2, 1)));
    changeQuantity(1, 7);
    applyServerCart(cartOf(line(1, 2), line(2, 1))); // phản hồi cũ từ request khác
    expect(getCartState().cart?.items[0].quantity).toBe(7);
  });
  it("đổi số lượng lỗi: báo toast và hoàn lại theo dữ liệu server", async () => {
    applyServerCart(cartOf(line(1, 2)));
    svc.setQuantity.mockRejectedValue(new ApiError(409, "INSUFFICIENT_STOCK", "x", [], undefined, undefined, { available: 3, inCart: 2 }));
    svc.get.mockResolvedValue(cartOf(line(1, 2)));
    changeQuantity(1, 9);
    await vi.advanceTimersByTimeAsync(QUANTITY_DEBOUNCE_MS + 10);
    expect(notifyMock).toHaveBeenCalledWith("error", expect.stringContaining("Chỉ còn 3"));
    expect(getCartState().cart?.items[0].quantity).toBe(2);
  });
  it("xóa dòng dùng endpoint phù hợp và cập nhật giỏ", async () => {
    svc.removeItem.mockResolvedValue(cartOf());
    await removeCartItems([1]);
    expect(svc.removeItem).toHaveBeenCalledWith(1);
    svc.removeItems.mockResolvedValue(cartOf());
    await removeCartItems([1, 2]);
    expect(svc.removeItems).toHaveBeenCalledWith([1, 2]);
    expect(getCartState().summary?.totalQuantity).toBe(0);
  });
  it("xóa sạch khi token bị xóa (đăng xuất)", () => {
    applyServerCart(cartOf(line(1, 2)));
    clearToken();
    expect(getCartState().cart).toBeNull();
    expect(getCartState().summary).toBeNull();
  });
});
