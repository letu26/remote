"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { adminCustomerService } from "@/services/admin-customer.service";
import { adminOrderService } from "@/services/admin-order.service";
import type { Paged } from "@/types/admin-catalog";
import type { AdminOrderListItem } from "@/types/admin-order";
import { formatVND } from "@/utils/format";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderBadges";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  buildOrderSearch,
  filtersToQuery,
  formatDateTime,
  parseOrderFilters,
  type OrderFilters,
} from "./order-meta";

const PAGE_SIZE = 20;

/** Danh sách đơn hàng; bộ lọc nằm trên URL (q, status, paymentStatus, from, to, page). */
export function OrderList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo(() => parseOrderFilters(new URLSearchParams(params.toString())), [params]);
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounce(search.trim(), 500);
  const [data, setData] = useState<Paged<AdminOrderListItem> | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [customerName, setCustomerName] = useState<string | null>(null);

  const apply = useCallback(
    (patch: Partial<OrderFilters>) => {
      const next = { ...filters, page: 1, ...patch };
      router.replace(`${pathname}${buildOrderSearch(next)}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  // Ô tìm kiếm -> URL sau khi dừng gõ 500ms.
  useEffect(() => {
    if (debounced !== filters.q) apply({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi giá trị debounce đổi
  }, [debounced]);

  // URL đổi từ bên ngoài (nút Xóa bộ lọc, back/forward) -> đồng bộ lại ô tìm kiếm.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ ô nhập với URL
    setSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ trạng thái tải với bộ lọc
    setLoading(true);
    setFailed(false);
    adminOrderService
      .list(filtersToQuery(filters, PAGE_SIZE))
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  // Tên khách khi lọc theo ?userId= (lỗi thì chỉ hiện mã khách).
  useEffect(() => {
    if (!filters.userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- xóa tên khi bỏ lọc
      setCustomerName(null);
      return;
    }
    let cancelled = false;
    adminCustomerService
      .get(Number(filters.userId))
      .then((c) => !cancelled && setCustomerName(c.fullName))
      .catch(() => !cancelled && setCustomerName(null));
    return () => {
      cancelled = true;
    };
  }, [filters.userId]);

  const items = data?.items ?? [];
  const filtered = filters.q || filters.status || filters.paymentStatus || filters.from || filters.to || filters.userId;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <Field label="Tìm kiếm" name="order-search" type="search" placeholder="Mã đơn, tên hoặc SĐT người nhận" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select
          label="Trạng thái đơn"
          name="filter-status"
          value={filters.status}
          options={[{ value: "", label: "Tất cả" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))]}
          onChange={(e) => apply({ status: e.target.value as OrderFilters["status"] })}
        />
        <Select
          label="Thanh toán"
          name="filter-payment"
          value={filters.paymentStatus}
          options={[{ value: "", label: "Tất cả" }, ...PAYMENT_STATUSES.map((s) => ({ value: s, label: PAYMENT_STATUS_LABEL[s] }))]}
          onChange={(e) => apply({ paymentStatus: e.target.value as OrderFilters["paymentStatus"] })}
        />
        <Field label="Từ ngày" name="filter-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => apply({ from: e.target.value })} />
        <Field label="Đến ngày" name="filter-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => apply({ to: e.target.value })} />
      </div>
      {filters.userId && (
        <div className="flex flex-wrap items-center gap-2 rounded-ui bg-gold-tint px-3 py-2 text-sm text-gold-deeper" data-testid="customer-filter">
          <span>Đơn của {customerName ?? `khách #${filters.userId}`}</span>
          <Button size="sm" variant="ghost" onClick={() => apply({ userId: "" })}>Bỏ lọc khách hàng</Button>
        </div>
      )}
      {filtered && (
        <Button size="sm" variant="ghost" onClick={() => router.replace(pathname, { scroll: false })}>
          Xóa bộ lọc
        </Button>
      )}

      {loading && !data && (
        <div className="space-y-2" aria-busy="true" aria-label="Đang tải">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {failed && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}
      {!failed && data && items.length === 0 && (
        <EmptyState
          title={filtered ? "Không tìm thấy đơn hàng phù hợp" : "Chưa có đơn hàng nào"}
          description={filtered ? "Thử đổi từ khóa hoặc bộ lọc." : "Đơn hàng của khách sẽ hiện ở đây."}
        />
      )}

      {!failed && items.length > 0 && (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-paper shadow-card md:block">
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Danh sách đơn hàng</caption>
              <thead className="bg-sand text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Mã đơn</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Ngày đặt</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Người nhận</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Tổng tiền</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Trạng thái</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Thanh toán</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((o) => (
                  <tr key={o.id}>
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold">{o.code}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{formatDateTime(o.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-ink">{o.receiverName}</div>
                      <div className="text-xs text-muted">{o.receiverPhone} · {o.itemCount} sản phẩm</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">{formatVND(o.total)}</td>
                    <td className="px-3 py-2.5"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-3 py-2.5">
                      <PaymentStatusBadge status={o.paymentStatus} />
                      <div className="mt-0.5 text-[11px] text-muted">{o.paymentMethod === "cod" ? "COD" : "Chuyển khoản"}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <ButtonLink href={`/admin/orders/${o.id}`} size="sm" variant="secondary" aria-label={`Xem đơn ${o.code}`}>Xem</ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((o) => (
              <li key={o.id} className="rounded-lg border border-line bg-paper p-3 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm font-semibold text-ink hover:underline">{o.code}</Link>
                  <span className="text-xs text-muted">{formatDateTime(o.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-ink">{o.receiverName} · {o.receiverPhone}</p>
                <p className="text-xs text-muted">{o.itemCount} sản phẩm · {PAYMENT_METHOD_LABEL[o.paymentMethod]}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <OrderStatusBadge status={o.status} />
                  <PaymentStatusBadge status={o.paymentStatus} />
                  <span className="ml-auto text-sm font-semibold">{formatVND(o.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={(p) => apply({ page: p })} />}
    </section>
  );
}

