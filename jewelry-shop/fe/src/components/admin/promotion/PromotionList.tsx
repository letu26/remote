"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { adminPromotionService } from "@/services/admin-promotion.service";
import type { Paged } from "@/types/admin-catalog";
import type { AdminPromotion, PromotionStatus } from "@/types/admin-promotion";
import { confirmAction } from "@/utils/confirm";
import { notify } from "@/utils/notify";
import { adminErrorMessage } from "../admin-errors";
import { formatLocal } from "../dashboard/date-utils";
import { PromotionModal } from "./PromotionModal";
import { PROMOTION_STATUSES, PROMOTION_STATUS_LABEL, PROMOTION_STATUS_TONE } from "./promotion-form";

const PAGE_SIZE = 20;

export interface PromotionFilters {
  q: string;
  status: PromotionStatus | "";
  page: number;
}
export function parsePromotionFilters(p: URLSearchParams): PromotionFilters {
  const st = p.get("status") ?? "";
  const page = Number(p.get("page"));
  return {
    q: p.get("q") ?? "",
    status: (PROMOTION_STATUSES as string[]).includes(st) ? (st as PromotionStatus) : "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}
export function buildPromotionSearch(f: PromotionFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.status) p.set("status", f.status);
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function StatusPill({ status }: { status: PromotionStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${PROMOTION_STATUS_TONE[status]}`}>
      {PROMOTION_STATUS_LABEL[status]}
    </span>
  );
}

export function PromotionList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo(() => parsePromotionFilters(new URLSearchParams(params.toString())), [params]);
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounce(search.trim(), 500);
  const [data, setData] = useState<Paged<AdminPromotion> | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPromotion | null>(null);

  const apply = useCallback(
    (patch: Partial<PromotionFilters>) => {
      router.replace(`${pathname}${buildPromotionSearch({ ...filters, page: 1, ...patch })}`, { scroll: false });
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
    adminPromotionService
      .list({ page: filters.page, pageSize: PAGE_SIZE, q: filters.q || undefined, status: filters.status || undefined })
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const toggle = async (p: AdminPromotion) => {
    setBusyId(p.id);
    try {
      await adminPromotionService.update(p.id, { isActive: !p.isActive });
      notify("success", p.isActive ? "Đã tắt khuyến mại" : "Đã bật khuyến mại");
      reload();
    } catch (e) {
      notify("error", adminErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: AdminPromotion) => {
    const ok = await confirmAction({ title: "Xóa khuyến mại", text: `Xóa khuyến mại "${p.name}" của ${p.productName}? Thao tác này không thể hoàn tác.`, confirmText: "Xóa", tone: "danger" });
    if (!ok) return;
    setBusyId(p.id);
    try {
      await adminPromotionService.remove(p.id);
      notify("success", "Đã xóa khuyến mại");
      reload();
    } catch (e) {
      notify("error", adminErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const items = data?.items ?? [];
  const filtered = filters.q || filters.status;
  const actions = (p: AdminPromotion) => (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button size="sm" variant="ghost" loading={busyId === p.id} onClick={() => toggle(p)} aria-label={`${p.isActive ? "Tắt" : "Bật"} ${p.name} - ${p.productCode}`}>
        {p.isActive ? "Tắt" : "Bật"}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => { setEditing(p); setModalOpen(true); }} aria-label={`Sửa ${p.name} - ${p.productCode}`}>Sửa</Button>
      <Button size="sm" variant="ghost" className="text-danger! hover:bg-danger/10!" onClick={() => remove(p)} aria-label={`Xóa ${p.name} - ${p.productCode}`}>Xóa</Button>
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field label="Tìm kiếm" name="promo-search" type="search" placeholder="Tên khuyến mại, tên hoặc mã sản phẩm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="min-w-40">
          <Select
            label="Trạng thái"
            name="filter-status"
            value={filters.status}
            options={[{ value: "", label: "Tất cả" }, ...PROMOTION_STATUSES.map((s) => ({ value: s, label: PROMOTION_STATUS_LABEL[s] }))]}
            onChange={(e) => apply({ status: e.target.value as PromotionFilters["status"] })}
          />
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>Thêm khuyến mại</Button>
      </div>

      {loading && !data && (
        <div className="space-y-2" aria-busy="true" aria-label="Đang tải">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      )}
      {failed && <ErrorState onRetry={reload} />}
      {!failed && data && items.length === 0 && (
        <EmptyState title={filtered ? "Không tìm thấy khuyến mại phù hợp" : "Chưa có khuyến mại nào"} description={filtered ? "Thử đổi từ khóa hoặc bộ lọc." : "Nhấn \"Thêm khuyến mại\" để tạo khuyến mại đầu tiên."} />
      )}

      {!failed && items.length > 0 && (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-paper shadow-card md:block">
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Danh sách khuyến mại</caption>
              <thead className="bg-sand text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Khuyến mại</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Sản phẩm</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Giảm</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Thời gian</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Trạng thái</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2.5 font-medium text-ink">{p.name}</td>
                    <td className="px-3 py-2.5">{p.productName}<div className="font-mono text-xs text-muted">{p.productCode}</div></td>
                    <td className="px-3 py-2.5 text-right font-semibold">{p.discountPercent}%</td>
                    <td className="px-3 py-2.5 text-xs">{formatLocal(p.startsAt)}<br />{formatLocal(p.endsAt)}</td>
                    <td className="px-3 py-2.5"><StatusPill status={p.status} /></td>
                    <td className="px-3 py-2.5">{actions(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {items.map((p) => (
              <li key={p.id} className="rounded-lg border border-line bg-paper p-3 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{p.name}</p>
                  <StatusPill status={p.status} />
                </div>
                <p className="text-sm">{p.productName} <span className="font-mono text-xs text-muted">({p.productCode})</span></p>
                <p className="text-xs text-muted">Giảm {p.discountPercent}% · {formatLocal(p.startsAt)} - {formatLocal(p.endsAt)}</p>
                <div className="mt-2 border-t border-line pt-2">{actions(p)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={(p) => apply({ page: p })} />}

      <PromotionModal
        open={modalOpen}
        editing={editing}
        loaded={items}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); reload(); }}
      />
    </section>
  );
}
