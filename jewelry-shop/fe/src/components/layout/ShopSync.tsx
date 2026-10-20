"use client";

import { useEffect } from "react";
import { loadCartSummary } from "@/store/cart-store";
import { useAuth } from "@/store/auth-context";
import { loadWishlistIds } from "@/store/wishlist-store";

/** Khi đăng nhập: tải số giỏ hàng và danh sách yêu thích một lần. Đăng xuất thì store tự xóa. */
export function ShopSync() {
  const { status, user } = useAuth();
  const userId = user?.id;
  useEffect(() => {
    if (status !== "authenticated") return;
    void loadCartSummary();
    void loadWishlistIds();
  }, [status, userId]);
  return null;
}
