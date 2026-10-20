"use client";

import { useSyncExternalStore } from "react";
import { wishlistService } from "@/services/wishlist.service";
import { getToken, subscribeToken } from "./token-store";

/** Các productId đang được yêu thích (GET /wishlist/ids, tải một lần khi đăng nhập). */
let ids: ReadonlySet<number> = new Set();
let loaded = false;
const listeners = new Set<() => void>();
const inFlight = new Set<number>();

function emit() {
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const EMPTY_IDS: ReadonlySet<number> = new Set();
export const getWishlistIds = () => ids;
export const isWishlistLoaded = () => loaded;
export const useWishlistIds = () => useSyncExternalStore(subscribe, getWishlistIds, () => EMPTY_IDS);
export const useWishlistLoaded = () => useSyncExternalStore(subscribe, isWishlistLoaded, () => false);
export const useIsWishlisted = (productId: number) =>
  useSyncExternalStore(subscribe, () => ids.has(productId), () => false);

function replace(next: Iterable<number>) {
  ids = new Set(next);
  emit();
}

export async function loadWishlistIds() {
  if (!getToken() || loaded) return;
  try {
    const list = await wishlistService.ids();
    if (!getToken()) return;
    loaded = true;
    replace(list);
  } catch {
    /* lỗi đã được interceptor xử lý; thử lại ở lần đăng nhập sau */
  }
}

/**
 * Bật/tắt yêu thích, cập nhật ngay (optimistic) và hoàn lại nếu API lỗi (ném lại lỗi).
 * Trả về trạng thái mới. Bỏ qua nếu sản phẩm này đang chờ phản hồi.
 */
export async function toggleWishlist(productId: number): Promise<boolean | null> {
  if (inFlight.has(productId)) return null;
  inFlight.add(productId);
  const had = ids.has(productId);
  const next = new Set(ids);
  if (had) next.delete(productId);
  else next.add(productId);
  replace(next);
  try {
    if (had) await wishlistService.remove(productId);
    else await wishlistService.add(productId);
    return !had;
  } catch (err) {
    const back = new Set(ids);
    if (had) back.add(productId);
    else back.delete(productId);
    replace(back);
    throw err;
  } finally {
    inFlight.delete(productId);
  }
}

/** Bỏ khỏi tập (khi trang yêu thích xóa một sản phẩm thành công). */
export function dropWishlistId(productId: number) {
  const next = new Set(ids);
  next.delete(productId);
  replace(next);
}

export function resetWishlist() {
  loaded = false;
  inFlight.clear();
  ids = new Set();
  emit();
}

if (typeof window !== "undefined") {
  subscribeToken(() => {
    if (!getToken()) resetWishlist();
  });
}
