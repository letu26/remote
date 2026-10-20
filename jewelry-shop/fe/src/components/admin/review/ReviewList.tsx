"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Rating } from "@/components/ui/Rating";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { adminReviewService } from "@/services/admin-review.service";
import type { Paged } from "@/types/admin-catalog";
import type { AdminReview } from "@/types/admin-review";
import { confirmAction } from "@/utils/confirm";
import { notify } from "@/utils/notify";
import { adminErrorMessage } from "../admin-errors";
import { formatDateTime } from "../order/order-meta";
import { buildReviewSearch, parseReviewFilters, reviewFiltersToQuery, type ReviewFilters } from "./review-filters";

const PAGE_SIZE = 20;
const PREVIEW_LEN = 120;

/** Nội dung hiển thị dạng văn bản thuần (React tự escape, không render HTML). */
function Comment({ text }: { text: string | null }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span className="text-muted">(Không có nhận xét)</span>;
  const long = text.length > PREVIEW_LEN;
  return (
    <div>
      <p className="whitespace-pre-wrap break-words">{long && !open ? `${text.slice(0, PREVIEW_LEN)}...` : text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-0.5 text-xs text-gold-deep hover:underline">
          {open ? "Thu gọn" : "Xem đầy đủ"}
        </button>
      )}
    </div>
  );
}

export function ReviewList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo(() => parseReviewFilters(new URLSearchParams(params.toString())), [params]);
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounce(search.trim(), 500);
  const [data, setData] = useState<Paged<AdminReview> | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);

  const apply = useCallback(
    (patch: Partial<ReviewFilters>) => {
      router.replace(`${pathname}${buildReviewSearch({ ...filters, page: 1, ...patch })}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  useEffect(() => {
    if (debounced !== filters.q) apply({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi giá trị debounce đổi
  }, [debounced]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ ô nhập với URL
    setSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ trạng thái tải với bộ lọc
    setLoading(true);
    setFailed(false);
    adminReviewService
      .list(reviewFiltersToQuery(filters, PAGE_SIZE))
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  const toggle = async (r: AdminReview) => {
    const hide = !r.isHidden;
    const ok = await confirmAction({
      title: hide ? "Ẩn đánh giá" : "Hiện đánh giá",
      text: hide
        ? `Ẩn đánh giá của ${r.reviewerName}? Đánh giá sẽ không còn hiển thị công khai và không tính vào điểm trung bình.`
        : `Hiện lại đánh giá của ${r.reviewerName}? Đánh giá sẽ được tính lại vào điểm trung bình.`,
      confirmText: hide ? "Ẩn" : "Hiện",
      tone: hide ? "danger" : "default",
    });
    if (!ok) return;
    setBusyId(r.id);
    try {
      const updated = await adminReviewService.setHidden(r.id, hide);
      setData((d) => (d ? { ...d, items: d.items.map((i) => (i.id === r.id ? { ...i, ...updated } : i)) } : d));
      notify("success", hide ? "Đã ẩn đánh giá" : "Đã hiện đánh giá");
    } catch (e) {
      notify("error", adminErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const items = data?.items ?? [];
  const filtered = filters.q || filters.rating || filters.hidden || filters.productId;

  const action = (r: AdminReview) => (
    <Button size="sm" variant={r.isHidden ? "secondary" : "ghost"} loading={busyId === r.id} onClick={() => toggle(r)} aria-label={`${r.isHidden ? "Hiện" : "Ẩn"} đánh giá của ${r.reviewerName}`}>
      {r.isHidden ? "Hiện" : "Ẩn"}
    </Button>
  );
  const status = (r: AdminReview) => <Badge tone={r.isHidden ? "neutral" : "success"}>{r.isHidden ? "Đã ẩn" : "Đang hiển thị"}</Badge>;
  const product = (r: AdminReview) => (
    <Link href={`/products/${r.productSlug}`} target="_blank" className="font-medium text-ink hover:text-gold-deep hover:underline">
      {r.productName} <span className="font-mono text-xs text-muted">({r.productCode})</span>
    </Link>
  );

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Tìm kiếm" name="review-search" type="search" placeholder="Nội dung, sản phẩm, người đánh giá" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select
          label="Số sao"
          name="filter-rating"
          value={filters.rating}
          options={[{ value: "", label: "Tất cả" }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} sao` }))]}
          onChange={(e) => apply({ rating: e.target.value as ReviewFilters["rating"] })}
        />
        <Select
          label="Trạng thái"
          name="filter-hidden"
          value={filters.hidden}
          options={[
            { value: "", label: "Tất cả" },
            { value: "false", label: "Đang hiển thị" },
            { value: "true", label: "Đã ẩn" },
          ]}
          onChange={(e) => apply({ hidden: e.target.value as ReviewFilters["hidden"] })}
        />
        {filters.productId && (
          <div className="flex items-end">
            <Button variant="secondary" size="sm" onClick={() => apply({ productId: "" })}>
              Đang lọc theo sản phẩm #{filters.productId} (bỏ lọc)
            </Button>
          </div>
        )}
      </div>

      {loading && !data && (
        <div className="space-y-2" aria-busy="true" aria-label="Đang tải">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}
      {failed && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}
      {!failed && data && items.length === 0 && (
        <EmptyState
          title={filtered ? "Không tìm thấy đánh giá phù hợp" : "Chưa có đánh giá nào"}
          description={filtered ? "Thử đổi từ khóa hoặc bộ lọc." : "Đánh giá của khách sẽ hiện ở đây."}
        />
      )}

      {!failed && items.length > 0 && (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-paper shadow-card md:block">
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Danh sách đánh giá</caption>
              <thead className="bg-sand text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Người đánh giá</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Sản phẩm</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Đánh giá</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Trạng thái</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((r) => (
                  <tr key={r.id} className={r.isHidden ? "bg-sand/50" : ""}>
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-medium text-ink">{r.reviewerName}</div>
                      <div className="text-xs text-muted">{r.reviewerPhone}</div>
                    </td>
                    <td className="px-3 py-2.5 align-top">{product(r)}</td>
                    <td className="max-w-md px-3 py-2.5 align-top">
                      <Rating value={r.rating} />
                      <div className="mt-1"><Comment text={r.comment} /></div>
                      <div className="mt-1 text-xs text-muted">{formatDateTime(r.createdAt)}</div>
                    </td>
                    <td className="px-3 py-2.5 align-top">{status(r)}</td>
                    <td className="px-3 py-2.5 text-right align-top">{action(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((r) => (
              <li key={r.id} className={`rounded-lg border border-line p-3 shadow-card ${r.isHidden ? "bg-sand/50" : "bg-paper"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{r.reviewerName}</p>
                    <p className="text-xs text-muted">{r.reviewerPhone} · {formatDateTime(r.createdAt)}</p>
                  </div>
                  {status(r)}
                </div>
                <div className="mt-2 text-sm">{product(r)}</div>
                <div className="mt-1"><Rating value={r.rating} /></div>
                <div className="mt-1 text-sm"><Comment text={r.comment} /></div>
                <div className="mt-2 border-t border-line pt-2 text-right">{action(r)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={(p) => apply({ page: p })} />}
    </section>
  );
}
