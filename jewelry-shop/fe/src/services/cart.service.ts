import { http } from "@/services/http";
import type { Cart, CartSummary } from "@/types/shop";

export const cartService = {
  get: (signal?: AbortSignal) => http.get<Cart>("/cart", { signal }).then((r) => r.data),
  summary: () => http.get<CartSummary>("/cart/summary").then((r) => r.data),
  addItem: (variantId: number, quantity = 1) =>
    http.post<Cart>("/cart/items", { variantId, quantity }).then((r) => r.data),
  setQuantity: (itemId: number, quantity: number) =>
    http.patch<Cart>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  removeItem: (itemId: number) => http.delete<Cart>(`/cart/items/${itemId}`).then((r) => r.data),
  removeItems: (itemIds: number[]) =>
    http.post<Cart>("/cart/items/remove", { itemIds }).then((r) => r.data),
  clear: () => http.delete("/cart").then(() => undefined),
};
