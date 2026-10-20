"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants";
import { useAsyncData } from "@/hooks/useAsyncData";
import { wishlistService } from "@/services/wishlist.service";
import { useWishlistIds, useWishlistLoaded } from "@/store/wishlist-store";

const PAGE_SIZE = 12;

export function WishlistView() {
  const [page, setPage] = useState(1);
  const { data, loading, failed, reload } = useAsyncData(`wishlist-${page}`, (signal) =>
    wishlistService.list(page, PAGE_SIZE, signal),
  );
  const ids = useWishlistIds();
  const loaded = useWishlistLoaded();
  // Bỏ tim ở thẻ nào thì thẻ đó biến mất ngay; lỗi API thì tim được hoàn lại và thẻ hiện lại.
  const items = (data?.items ?? []).filter((p) => !loaded || ids.has(p.id));

  const total = data?.total ?? 0;

  if (failed) return <ErrorState onRetry={reload} />;
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Đang tải">
        {Array.from({ length: 4 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (data && data.items.length > 0 && items.length === 0) {
    return (
      <EmptyState
        title="Bạn đã bỏ hết sản phẩm ở trang này"
        action={<Button onClick={() => (page > 1 ? setPage(page - 1) : reload())}>Tải lại danh sách</Button>}
      />
    );
  }
  if (total === 0 || (data && data.items.length === 0)) {
    return (
      <EmptyState
        title="Chưa có sản phẩm yêu thích"
        description="Bấm vào biểu tượng trái tim ở sản phẩm để lưu lại xem sau."
        action={<ButtonLink href={ROUTES.products}>Khám phá sản phẩm</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
          <li key={p.id} className="flex">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      <Pagination page={data!.page} totalPages={data!.totalPages} onPageChange={setPage} />
    </div>
  );
}
