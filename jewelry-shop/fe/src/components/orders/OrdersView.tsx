"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductImage } from "@/components/product/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants";
import { useAsyncData } from "@/hooks/useAsyncData";
import { orderService } from "@/services/order.service";
import type { OrderListItem, OrderStatus } from "@/types/order";
import { formatDateTime, formatVND } from "@/utils/format";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_ORDER,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
} from "@/utils/order";
import { artFor, metalFor } from "@/utils/product-art";

const PAGE_SIZE = 10;
type Tab = "all" | OrderStatus;
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  ...ORDER_STATUS_ORDER.map((s) => ({ key: s as Tab, label: ORDER_STATUS_LABEL[s] })),
];

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

function OrderCard({ order }: { order: OrderListItem }) {
  return (
    <li>
      <Link
        href={`${ROUTES.orders}/${encodeURIComponent(order.code)}`}
        className="block rounded-lg border border-line bg-paper p-4 shadow-card transition-colors hover:border-gold-deep"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium text-ink">Đơn {order.code}</p>
            <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <Badge tone={order.paymentStatus === "paid" ? "success" : "neutral"}>
              {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </Badge>
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {order.items.slice(0, 3).map((it, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <div className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-ui border border-line">
                <ProductImage url={it.imageUrl} alt={it.productName} art={artFor(undefined)} metal={metalFor(undefined)} sizes="3rem" />
              </div>
              <span className="min-w-0 flex-1 truncate">
                {it.productName}
                {it.size ? ` (size ${it.size})` : ""}
              </span>
              <span className="text-muted">x{it.quantity}</span>
            </li>
          ))}
        </ul>
        {order.itemCount > order.items.length && (
          <p className="mt-1 text-xs text-muted">và {order.itemCount - order.items.length} sản phẩm khác</p>
        )}
        <p className="mt-3 text-right text-sm">
          Tổng tiền: <span className="font-semibold text-ink">{formatVND(order.total)}</span>
        </p>
      </Link>
    </li>
  );
}

export function OrdersView() {
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const { data, loading, failed, reload } = useAsyncData(`orders-${tab}-${page}`, (signal) =>
    orderService.list({ page, pageSize: PAGE_SIZE, status: tab === "all" ? undefined : tab }, signal),
  );

  return (
    <section className="space-y-5">
      <div role="tablist" aria-label="Lọc theo trạng thái" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              tab === t.key
                ? "border-gold-deep bg-gold-deep text-white"
                : "border-line-strong bg-paper text-ink hover:bg-sand"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {failed ? (
        <ErrorState onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={tab === "all" ? "Bạn chưa có đơn hàng nào" : `Không có đơn "${ORDER_STATUS_LABEL[tab]}"`}
          description="Các đơn hàng của bạn sẽ hiển thị ở đây."
          action={<ButtonLink href={ROUTES.products}>Mua sắm ngay</ButtonLink>}
        />
      ) : (
        <>
          <ul className="space-y-3">
            {data.items.map((o) => (
              <OrderCard key={o.code} order={o} />
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}
