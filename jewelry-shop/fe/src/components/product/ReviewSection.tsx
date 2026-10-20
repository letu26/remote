"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { inputClass } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Rating } from "@/components/ui/Rating";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarPicker } from "@/components/ui/StarPicker";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { reviewService } from "@/services/review.service";
import { useAuth } from "@/store/auth-context";
import { setRatingOverride, useRatingOverride } from "@/store/review-summary-store";
import type { MyReview, PublicReview, ReviewSummary } from "@/types/review";
import { confirmAction } from "@/utils/confirm";
import { ApiError } from "@/utils/errors";
import { formatLocalDateTime } from "@/utils/format";
import { notify } from "@/utils/notify";
import { loginUrl } from "@/utils/redirect";
import { isReviewStateError, reviewErrorMessage } from "@/utils/review-errors";
import { REVIEW_COMMENT_MAX, validateReview } from "@/utils/validators";

const PAGE_SIZE = 10;

/** Điểm + số lượt ở đầu trang chi tiết: tự cập nhật khi khách tạo/sửa/xóa đánh giá. */
export function LiveRating({ productId, avgRating, reviewCount }: { productId: number; avgRating: number; reviewCount: number }) {
  const o = useRatingOverride(productId);
  const avg = o?.avgRating ?? avgRating;
  const count = o?.reviewCount ?? reviewCount;
  return count > 0 ? <Rating value={avg} count={count} /> : <span className="text-sm text-muted">Chưa có đánh giá</span>;
}

function Summary({ summary }: { summary: ReviewSummary }) {
  if (summary.reviewCount === 0) return <p className="text-sm text-muted">Chưa có đánh giá</p>;
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-lg border border-line bg-paper p-5 shadow-card">
      <div className="text-center">
        <p className="font-serif text-5xl text-gold-deep" data-testid="avg-rating">{summary.avgRating.toFixed(1)}</p>
        <div className="mt-1 flex justify-center"><Rating value={summary.avgRating} size={18} /></div>
        <p className="mt-1 text-sm text-muted" data-testid="review-count">{summary.reviewCount} đánh giá</p>
      </div>
      <ul className="min-w-48 flex-1 space-y-1.5" aria-label="Phân bố số sao">
        {([5, 4, 3, 2, 1] as const).map((n) => {
          const c = summary.distribution[String(n) as "1"] ?? 0;
          const pct = summary.reviewCount ? Math.round((c / summary.reviewCount) * 100) : 0;
          return (
            <li key={n} className="flex items-center gap-2 text-xs text-muted">
              <span className="w-10 shrink-0">{n} sao</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand" aria-hidden>
                <span className="block h-full bg-gold" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right">{c}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewItem({ review }: { review: PublicReview }) {
  return (
    <li className="space-y-1.5 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Rating value={review.rating} size={14} />
        <span className="text-sm font-medium text-ink">{review.reviewerName}</span>
        {review.isMine && <span className="text-xs font-semibold text-gold-deeper">Của bạn</span>}
        <time dateTime={review.createdAt} className="text-xs text-muted">{formatLocalDateTime(review.createdAt)}</time>
      </div>
      {/* Hiển thị như văn bản thuần (React tự thoát ký tự), xuống dòng giữ nguyên. */}
      {review.comment && <p className="whitespace-pre-line break-words text-sm text-ink">{review.comment}</p>}
    </li>
  );
}

export function ReviewForm({
  slug,
  initial,
  onDone,
  onCancel,
  onStale,
}: {
  slug: string;
  initial?: MyReview;
  onDone: () => void;
  onCancel?: () => void;
  /** Trạng thái khung viết đã cũ (đã đánh giá, bị ẩn, chưa được phép): tải lại. */
  onStale: () => void;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const { errors, submitting, run, clearError } = useFormSubmit();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(validateReview({ rating, comment }), async () => {
      const input = { rating, comment: comment.trim() };
      try {
        if (initial) await reviewService.update(initial.id, input);
        else await reviewService.create(slug, input);
      } catch (err) {
        if (isReviewStateError(err)) {
          onStale();
          throw new ApiError(err.status, err.code, reviewErrorMessage(err), err.details);
        }
        throw err;
      }
    });
    if (ok) {
      notify("success", initial ? "Đã cập nhật đánh giá" : "Cảm ơn bạn đã đánh giá sản phẩm");
      onDone();
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label={initial ? "Sửa đánh giá" : "Viết đánh giá"}>
      <div className="space-y-1.5">
        <p id="star-label" className="text-sm font-medium text-ink">Chấm điểm của bạn</p>
        <StarPicker
          value={rating}
          onChange={(v) => { setRating(v); clearError("rating"); }}
          labelledBy="star-label"
          invalid={!!errors.rating}
          disabled={submitting}
        />
        {errors.rating && <p role="alert" className="text-xs text-danger">{errors.rating}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="review-comment" className="block text-sm font-medium text-ink">Nhận xét (không bắt buộc)</label>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          aria-invalid={!!errors.comment}
          aria-describedby={errors.comment ? "review-comment-error" : undefined}
          disabled={submitting}
          onChange={(e) => { setComment(e.target.value); clearError("comment"); }}
          className={inputClass(!!errors.comment)}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm"
        />
        <div className="flex justify-between gap-3 text-xs">
          <span id="review-comment-error" role={errors.comment ? "alert" : undefined} className="text-danger">{errors.comment}</span>
          <span className={comment.trim().length > REVIEW_COMMENT_MAX ? "text-danger" : "text-muted"} aria-live="polite">
            {comment.length}/{REVIEW_COMMENT_MAX}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={submitting}>{initial ? "Lưu thay đổi" : "Gửi đánh giá"}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={submitting}>Hủy</Button>}
      </div>
    </form>
  );
}

function WriteBox({ slug, onChanged }: { slug: string; onChanged: () => void }) {
  const { status } = useAuth();
  const [rev, setRev] = useState(0);
  const [editing, setEditing] = useState(false);
  const authed = status === "authenticated";
  const mine = useAsyncData(`my-review-${slug}-${authed}-${rev}`, (signal) =>
    authed ? reviewService.myReview(slug, signal) : Promise.resolve(null),
  );

  if (status === "loading" || (authed && mine.loading)) return <Skeleton className="h-24 w-full" />;
  if (!authed) {
    return (
      <p className="text-sm text-muted">
        <Link href={loginUrl(`/products/${slug}#reviews`)} className="font-semibold text-gold-deep hover:underline">
          Đăng nhập
        </Link>{" "}
        để viết đánh giá cho sản phẩm này.
      </p>
    );
  }
  if (mine.failed || !mine.data) return <ErrorState title="Không tải được khung đánh giá" onRetry={mine.reload} />;

  const state = mine.data;
  const refresh = () => {
    setEditing(false);
    setRev((r) => r + 1);
    onChanged();
  };
  const stale = () => {
    setEditing(false);
    setRev((r) => r + 1);
  };

  const remove = async (r: MyReview) => {
    const ok = await confirmAction({
      title: "Xóa đánh giá",
      text: "Bạn có chắc muốn xóa đánh giá của mình về sản phẩm này?",
      confirmText: "Xóa",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await reviewService.remove(r.id);
      notify("success", "Đã xóa đánh giá");
      refresh();
    } catch (err) {
      notify("error", reviewErrorMessage(err));
      stale();
    }
  };

  if (state.review) {
    const r = state.review;
    if (editing && !r.isHidden) {
      return <ReviewForm slug={slug} initial={r} onDone={refresh} onCancel={() => setEditing(false)} onStale={stale} />;
    }
    return (
      <div className="space-y-2 rounded-lg border border-gold/50 bg-gold-tint p-4" aria-label="Đánh giá của bạn">
        <p className="text-sm font-semibold text-ink">Đánh giá của bạn</p>
        <Rating value={r.rating} size={16} />
        {r.comment && <p className="whitespace-pre-line break-words text-sm text-ink">{r.comment}</p>}
        {r.isHidden && (
          <p role="status" className="text-sm font-medium text-danger">Đánh giá của bạn đang bị ẩn bởi quản trị viên</p>
        )}
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="secondary" disabled={r.isHidden} onClick={() => setEditing(true)}>Sửa</Button>
          <Button size="sm" variant="ghost" className="text-danger!" onClick={() => remove(r)}>Xóa</Button>
        </div>
      </div>
    );
  }
  if (state.eligible) return <ReviewForm slug={slug} onDone={refresh} onStale={stale} />;
  return (
    <p className="rounded-ui border border-line bg-sand/60 px-4 py-3 text-sm text-muted">
      Chỉ khách đã mua và nhận hàng mới có thể đánh giá sản phẩm này
    </p>
  );
}

export function ReviewSection({
  productId,
  slug,
  avgRating,
  reviewCount,
}: {
  productId: number;
  slug: string;
  avgRating: number;
  reviewCount: number;
}) {
  const [filter, setFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [rev, setRev] = useState(0);
  const { data, loading, failed, reload } = useAsyncData(`reviews-${slug}-${filter}-${page}-${rev}`, (signal) =>
    reviewService.list(slug, { page, pageSize: PAGE_SIZE, rating: filter ?? undefined }, signal),
  );

  // Đẩy điểm và số lượt mới nhất lên phần đầu trang.
  useEffect(() => {
    if (data) setRatingOverride(productId, { avgRating: data.summary.avgRating, reviewCount: data.summary.reviewCount });
  }, [data, productId]);

  const summary: ReviewSummary =
    data?.summary ?? { avgRating, reviewCount, distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } };

  return (
    <section id="reviews" className="mt-10 scroll-mt-28" aria-labelledby="danh-gia">
      <h2 id="danh-gia" className="mb-6 font-serif text-3xl text-ink">Đánh giá khách hàng</h2>
      <div className="space-y-6">
        {data || !loading ? <Summary summary={summary} /> : <Skeleton className="h-32 w-full" />}

        <WriteBox slug={slug} onChanged={() => setRev((r) => r + 1)} />

        <div role="group" aria-label="Lọc theo số sao" className="flex flex-wrap gap-2">
          {[null, 5, 4, 3, 2, 1].map((n) => (
            <button
              key={n ?? "all"}
              type="button"
              aria-pressed={filter === n}
              onClick={() => { setFilter(n); setPage(1); }}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                filter === n ? "border-gold-deep bg-gold-deep text-white" : "border-line-strong bg-paper text-ink hover:bg-sand"
              }`}
            >
              {n === null ? "Tất cả" : `${n} sao`}
            </button>
          ))}
        </div>

        {failed ? (
          <ErrorState title="Không tải được đánh giá" onRetry={reload} />
        ) : loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Đang tải đánh giá">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title={filter ? `Chưa có đánh giá ${filter} sao` : "Chưa có đánh giá nào"}
            description="Hãy là người đầu tiên chia sẻ cảm nhận về sản phẩm này."
          />
        ) : (
          <>
            <ul className="divide-y divide-line" aria-label="Danh sách đánh giá">
              {data.items.map((r) => <ReviewItem key={r.id} review={r} />)}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </section>
  );
}
