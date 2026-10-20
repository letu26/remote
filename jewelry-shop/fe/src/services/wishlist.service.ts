import { http } from "@/services/http";
import type { Paginated } from "@/types/catalog";
import type { WishlistProduct } from "@/types/shop";

export const wishlistService = {
  list: (page = 1, pageSize = 12, signal?: AbortSignal) =>
    http.get<Paginated<WishlistProduct>>("/wishlist", { params: { page, pageSize }, signal }).then((r) => r.data),
  ids: () => http.get<{ productIds: number[] }>("/wishlist/ids").then((r) => r.data.productIds),
  add: (productId: number) => http.post<{ productId: number }>("/wishlist", { productId }).then((r) => r.data),
  remove: (productId: number) => http.delete(`/wishlist/${productId}`).then(() => undefined),
};
