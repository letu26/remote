"use client";

import { useSyncExternalStore } from "react";
import { cartService } from "@/services/cart.service";
import type { Cart, CartSummary } from "@/types/shop";
import { cartErrorMessage } from "@/utils/cart-errors";
import { notify } from "@/utils/notify";
import { getToken, subscribeToken } from "./token-store";

/**
 * Nguồn dữ liệu duy nhất của giỏ hàng ở fe: số lượng trên header và trang /cart cùng đọc từ đây.
 * Giá và thành tiền luôn lấy từ API; fe không tự tính lại.
 */
export type CartStatus = "idle" | "loading" | "ready" | "error";

interface CartState {
  summary: CartSummary | null;
  cart: Cart | null;
  status: CartStatus;
}

const EMPTY: CartState = { summary: null, cart: null, status: "idle" };
let state: CartState = EMPTY;
const listeners = new Set<() => void>();

function set(next: Partial<CartState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const getCartState = () => state;
export const useCartState = () => useSyncExternalStore(subscribe, getCartState, () => EMPTY);
/** Số lượng trên biểu tượng giỏ; null khi chưa đăng nhập hoặc chưa tải. */
export const useCartCount = (): number | null =>
  useSyncExternalStore(subscribe, () => state.summary?.totalQuantity ?? null, () => null);

// Số lượng người dùng vừa chỉnh nhưng server chưa xác nhận: giữ lại khi nhận giỏ từ các request khác.
const pending = new Map<number, number>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();
let requestSeq = 0;
let appliedSeq = 0;
export const QUANTITY_DEBOUNCE_MS = 400;

function withPending(cart: Cart): Cart {
  if (pending.size === 0) return cart;
  return { ...cart, items: cart.items.map((i) => (pending.has(i.id) ? { ...i, quantity: pending.get(i.id)! } : i)) };
}

/** Nhận giỏ đầy đủ từ server (mọi endpoint ghi đều trả về giỏ này). */
export function applyServerCart(cart: Cart) {
  set({
    cart: withPending(cart),
    summary: { itemCount: cart.itemCount, totalQuantity: cart.totalQuantity },
    status: "ready",
  });
}

export async function loadCartSummary() {
  if (!getToken()) return;
  try {
    const summary = await cartService.summary();
    if (getToken()) set({ summary });
  } catch {
    /* lỗi đã được interceptor xử lý; giữ số cũ */
  }
}

export async function loadCart() {
  if (!getToken()) return;
  if (state.status !== "ready") set({ status: "loading" });
  try {
    const cart = await cartService.get();
    if (getToken()) applyServerCart(cart);
  } catch {
    if (state.cart === null) set({ status: "error" });
  }
}

/** Thêm vào giỏ (cộng dồn). Ném lỗi để nơi gọi quyết định thông báo. */
export async function addToCart(variantId: number, quantity = 1): Promise<Cart> {
  const cart = await cartService.addItem(variantId, quantity);
  applyServerCart(cart);
  return cart;
}

/** Đổi số lượng: cập nhật ngay trên giao diện, gộp các lần bấm liên tiếp thành một request. */
export function changeQuantity(itemId: number, quantity: number) {
  if (!state.cart) return;
  pending.set(itemId, quantity);
  set({ cart: withPending(state.cart) });
  const old = timers.get(itemId);
  if (old) clearTimeout(old);
  timers.set(
    itemId,
    setTimeout(() => {
      timers.delete(itemId);
      void flush(itemId);
    }, QUANTITY_DEBOUNCE_MS),
  );
}

async function flush(itemId: number) {
  const quantity = pending.get(itemId);
  if (quantity === undefined) return;
  const seq = ++requestSeq;
  try {
    const cart = await cartService.setQuantity(itemId, quantity);
    if (pending.get(itemId) === quantity) pending.delete(itemId);
    if (seq > appliedSeq) {
      appliedSeq = seq;
      applyServerCart(cart);
    }
  } catch (err) {
    if (pending.get(itemId) === quantity) pending.delete(itemId);
    notify("error", cartErrorMessage(err));
    // Hoàn lại theo dữ liệu thật của server.
    try {
      const cart = await cartService.get();
      if (getToken()) applyServerCart(cart);
    } catch {
      /* giữ nguyên */
    }
  }
}

export async function removeCartItems(itemIds: number[]): Promise<Cart> {
  itemIds.forEach((id) => {
    pending.delete(id);
    const t = timers.get(id);
    if (t) clearTimeout(t);
    timers.delete(id);
  });
  const cart = itemIds.length === 1 ? await cartService.removeItem(itemIds[0]) : await cartService.removeItems(itemIds);
  applyServerCart(cart);
  return cart;
}

/** Bỏ các dòng đã đặt hàng khỏi store (server đã xóa), cập nhật số trên header rồi đối chiếu lại với server. */
export function dropCartItems(ids: number[]) {
  const gone = new Set(ids);
  if (state.cart) {
    const items = state.cart.items.filter((i) => !gone.has(i.id));
    const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
    set({
      cart: { ...state.cart, items, itemCount: items.length, totalQuantity },
      summary: { itemCount: items.length, totalQuantity },
    });
  }
  void loadCartSummary();
}

export function resetCart() {
  pending.clear();
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  state = EMPTY;
  listeners.forEach((l) => l());
}

// Token bị xóa (đăng xuất, hết phiên, 401...): xóa sạch dữ liệu giỏ.
if (typeof window !== "undefined") {
  subscribeToken(() => {
    if (!getToken()) resetCart();
  });
}
