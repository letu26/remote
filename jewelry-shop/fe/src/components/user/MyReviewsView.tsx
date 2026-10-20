"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { Rating } from "@/components/ui/Rating";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants";
import { useAsyncData } from "@/hooks/useAsyncData";
import { reviewService } from "@/services/review.service";
import { confirmAction } from "@/utils/confirm";
import { formatLocalDateTime } from "@/utils/format";
import { notify } from "@/utils/notify";
import { reviewErrorMessage } from "@/utils/review-errors";

const PAGE_SIZE = 10;

export function MyReviewsView() {
  const [page, setPage] = useState(1);
  const { data, loading, failed, reload } = useAsyncData(`my-reviews-${page}`, (signal) =>
    reviewService.mine({ page, pageSize: PAGE_SIZE }, signal),
  );
  const [busyId, setBusyId] = useState<number | null>(null);

  const remove = async (id: number, productName: string) => {
    if (busyId !== null) return;
    const ok = await confirmAction({
      title: "Xóa đánh giá",
      text: `Bạn có chắc muốn xóa đánh giá về "${productName}"?`,
      confirmText: "Xóa",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(id);
    try {
      await reviewService.remove(id);
      notify("success", "Đã xóa đánh giá");
      if (data && data.items.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      notify("error", reviewErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (failed) return <ErrorState onRetry={reload} />;
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="Bạn chưa có đánh giá nào"
        description="Sau khi nhận hàng, bạn có thể đánh giá sản phẩm đã mua."
        action={<ButtonLink href={ROUTES.orders}>Xem đơn hàng của tôi</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-3">
        {data.items.map((r) => (
          <li key={r.id} className="space-y-2 rounded-lg border border-line bg-paper p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/products/${r.productSlug}`} className="font-serif text-lg text-ink hover:text-gold-deep">
                {r.productName}
              </Link>
              <time dateTime={r.createdAt} className="text-xs text-muted">{formatLocalDateTime(r.createdAt)}</time>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Rating value={r.rating} size={16} />
              {r.isHidden && <Badge tone="sale">Đang bị ẩn bởi quản trị viên</Badge>}
            </div>
            {r.comment && <p className="whitespace-pre-line break-words text-sm text-ink">{r.comment}</p>}
            <div className="flex gap-2 pt-1">
              <ButtonLink
                href={`/products/${r.productSlug}#reviews`}
                size="sm"
                variant="secondary"
                aria-label={`Sửa đánh giá ${r.productName}`}
              >
                Sửa
              </ButtonLink>
              <Button
                size="sm"
                variant="ghost"
                className="text-danger!"
                loading={busyId === r.id}
                onClick={() => remove(r.id, r.productName)}
                aria-label={`Xóa đánh giá ${r.productName}`}
              >
                Xóa
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
}
