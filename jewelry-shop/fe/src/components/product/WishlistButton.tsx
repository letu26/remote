"use client";

import { HeartIcon } from "@/components/ui/Icons";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toggleWishlist, useIsWishlisted } from "@/store/wishlist-store";
import { isApiError } from "@/utils/errors";
import { notify } from "@/utils/notify";

/** Nút yêu thích: đổi ngay (optimistic), hoàn lại và báo toast nếu API lỗi. */
export function WishlistButton({
  productId,
  name,
  className = "",
}: {
  productId: number;
  name: string;
  className?: string;
}) {
  const on = useIsWishlisted(productId);
  const requireLogin = useRequireLogin();

  const onClick = async () => {
    if (!requireLogin()) return;
    try {
      const now = await toggleWishlist(productId);
      if (now === true) notify("success", "Đã thêm vào yêu thích");
      else if (now === false) notify("info", "Đã bỏ khỏi yêu thích");
    } catch (err) {
      notify("error", isApiError(err) && err.status !== 0 ? err.message : "Không cập nhật được yêu thích, vui lòng thử lại");
    }
  };

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Bỏ ${name} khỏi yêu thích` : `Thêm ${name} vào yêu thích`}
      onClick={onClick}
      className={`flex h-9 w-9 active:scale-95 items-center justify-center rounded-full bg-paper/90 shadow-card transition-colors hover:text-sale ${
        on ? "text-sale" : "text-muted"
      } ${className}`}
    >
      <HeartIcon width={18} height={18} filled={on} />
    </button>
  );
}
