"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminStatsService } from "@/services/admin-stats.service";
import type { DateRange, Granularity, OrdersByStatus } from "@/types/admin-stats";
import type { OrderStatus } from "@/types/admin-order";
import { formatVND } from "@/utils/format";
import { isCancel } from "axios";
import { OrderStatusBadge } from "../order/OrderBadges";
import { ORDER_STATUSES } from "../order/order-meta";
import { RevenueChart } from "./RevenueChart";
import { presetRange, validateRange, vnDateString } from "./date-utils";

const PRESETS = [7, 30, 90] as const;
const DEFAULT_DAYS = 30;

/** Khoảng ngày từ URL: `from`+`to` hợp lệ, hoặc `days` (7/30/90), mặc định 30 ngày. */
export function resolveRange(params: URLSearchParams, today: string): { range: DateRange; days: number | null } {
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (from && to && !validateRange(from, to)) return { range: { from, to }, days: null };
  const d = Number(params.get("days"));
  const days = (PRESETS as readonly number[]).includes(d) ? d : DEFAULT_DAYS;
  return { range: presetRange(days, today), days };
}

type State<T> = { status: "loading" | "ready" | "error"; data: T | null };

/** Nạp dữ liệu có hủy request cũ khi `key` đổi hoặc component bị gỡ; hỗ trợ thử lại. */
export function useStatsData<T>(fetcher: (signal: AbortSignal) => Promise<T>, key: string) {
  const [state, setState] = useState<State<T>>({ status: "loading", data: null });
  const [attempt, setAttempt] = useState(0);
  const fetchRef = useRef(fetcher);
  useEffect(() => {
    fetchRef.current = fetcher;
  });
  useEffect(() => {
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ trạng thái tải với khoảng ngày
    setState((s) => ({ status: "loading", data: s.data }));
    fetchRef
      .current(ctrl.signal)
      .then((data) => !ctrl.signal.aborted && setState({ status: "ready", data }))
      .catch((e) => {
        if (ctrl.signal.aborted || isCancel(e)) return;
        setState({ status: "error", data: null });
      });
    return () => ctrl.abort();
  }, [key, attempt]);
  return { ...state, retry: () => setAttempt((a) => a + 1) };
}

function Block<T>({
  title,
  state,
  isEmpty,
  emptyText,
  children,
  className = "",
  action,
  fixed = false,
}: {
  title: string;
  state: State<T> & { retry: () => void };
  isEmpty?: (data: T) => boolean;
  emptyText?: string;
  children: (data: T) => ReactNode;
  className?: string;
  action?: ReactNode;
  /** Khối cao cố định: phần nội dung cuộn bên trong khi dài hơn khung. */
  fixed?: boolean;
}) {
  const { status, data, retry } = state;
  return (
    <section className={`rounded-lg border border-line bg-paper p-4 shadow-card ${fixed ? "flex h-72 flex-col" : ""} ${className}`} aria-label={title}>
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-xl text-ink">{title}</h2>
        {action}
      </div>
      {status === "error" ? (
        <ErrorState title="Không tải được khối này" description="Các khối khác vẫn hoạt động bình thường." onRetry={retry} />
      ) : data === null ? (
        <div className="space-y-2" aria-busy="true" aria-label="Đang tải">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ) : isEmpty?.(data) ? (
        <p className="rounded-ui bg-sand px-4 py-8 text-center text-sm text-muted">{emptyText ?? "Chưa có dữ liệu."}</p>
      ) : (
        <div className={`${fixed ? "min-h-0 flex-1 overflow-y-auto pr-3 [scrollbar-gutter:stable]" : ""} ${status === "loading" ? "opacity-60 transition-opacity" : ""}`} aria-busy={status === "loading"}>
          {children(data)}
        </div>
      )}
    </section>
  );
}

function Kpi({ label, value, href, sub }: { label: string; value: string; href?: string; sub?: string }) {
  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </>
  );
  const cls = "rounded-ui border border-line bg-page p-3";
  return href ? (
    <Link href={href} className={`${cls} block hover:border-gold-deep`}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const STATUS_BAR: Record<OrderStatus, string> = {
  pending: "bg-gold",
  confirmed: "bg-ink/40",
  preparing: "bg-ink/55",
  shipping: "bg-gold-deep",
  delivered: "bg-success",
  cancelled: "bg-sale",
};

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "day", label: "Ngày" },
  { value: "month", label: "Tháng" },
  { value: "year", label: "Năm" },
];

export function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Ngày hiện tại chỉ tính ở client sau khi mount (tránh Date.now() lúc prerender).
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cần giờ hiện tại của trình duyệt
    setToday(vnDateString(new Date()));
  }, []);

  if (!today) return <Skeleton className="h-40 w-full" />;
  return <DashboardBody today={today} params={params} onNavigate={(qs) => router.replace(`${pathname}${qs}`, { scroll: false })} />;
}

function DashboardBody({ today, params, onNavigate }: { today: string; params: URLSearchParams; onNavigate: (qs: string) => void }) {
  const { range, days } = useMemo(() => resolveRange(new URLSearchParams(params.toString()), today), [params, today]);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [rangeError, setRangeError] = useState("");
  const key = `${range.from}|${range.to}`;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ ô ngày với URL
    setFrom(range.from);
    setTo(range.to);
    setRangeError("");
  }, [range.from, range.to]);

  const overview = useStatsData((s) => adminStatsService.overview(range, s), key);
  const revenue = useStatsData((s) => adminStatsService.revenue(range, granularity, s), `${key}|${granularity}`);
  const byStatus = useStatsData((s) => adminStatsService.ordersByStatus(range, s), key);
  const topProducts = useStatsData((s) => adminStatsService.topProducts(range, 10, s), key);
  const topCustomers = useStatsData((s) => adminStatsService.topCustomers(range, 10, s), key);
  const lowStock = useStatsData((s) => adminStatsService.lowStock(5, 20, s), "low");

  const applyCustom = () => {
    const err = validateRange(from, to);
    setRangeError(err ?? "");
    if (!err) onNavigate(`?from=${from}&to=${to}`);
  };

  const ov = overview.data;
  return (
    <div className="space-y-4">
      <section aria-label="Khoảng thời gian" className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-paper p-4 shadow-card">
        <div className="flex gap-1.5" role="group" aria-label="Chọn nhanh">
          {PRESETS.map((d) => (
            <Button key={d} size="sm" variant={days === d ? "primary" : "secondary"} aria-pressed={days === d} onClick={() => onNavigate(d === DEFAULT_DAYS ? "" : `?days=${d}`)}>
              {d} ngày
            </Button>
          ))}
        </div>
        <div className="w-40"><Field label="Từ ngày" name="stats-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="w-40"><Field label="Đến ngày" name="stats-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></div>
        <Button size="sm" variant="secondary" onClick={applyCustom}>Áp dụng</Button>
        {rangeError && <p role="alert" className="w-full text-xs text-danger">{rangeError}</p>}
      </section>

      <Block title="Tổng quan" state={overview}>
        {(o) => (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Đơn chờ xác nhận" value={String(o.pendingOrders)} href="/admin/orders?status=pending" />
            <Kpi label="Doanh thu hôm nay" value={formatVND(o.today.revenue)} sub={`${o.today.orders} đơn`} />
            <Kpi label="Doanh thu tháng này" value={formatVND(o.thisMonth.revenue)} sub={`${o.thisMonth.orders} đơn`} />
            <Kpi label="Sản phẩm sắp hết hàng" value={String(o.lowStockProducts)} />
            <Kpi label="Doanh thu trong kỳ" value={formatVND(o.inRange.revenue)} />
            <Kpi label="Số đơn trong kỳ" value={String(o.inRange.orders)} />
            <Kpi label="Giá trị đơn trung bình" value={formatVND(o.inRange.averageOrderValue)} />
            <Kpi label="Người dùng / Sản phẩm" value={`${o.totalCustomers} / ${o.totalProducts}`} href="/admin/customers" />
          </div>
        )}
      </Block>
      {ov && <p className="sr-only">Kỳ thống kê từ {ov.range.from} đến {ov.range.to}</p>}

      <Block
        title="Doanh thu"
        state={revenue}
        action={
          <div role="group" aria-label="Nhóm theo" className="flex gap-1">
            {GRANULARITIES.map((g) => (
              <Button key={g.value} size="sm" variant={granularity === g.value ? "primary" : "secondary"} aria-pressed={granularity === g.value} onClick={() => setGranularity(g.value)}>
                {g.label}
              </Button>
            ))}
          </div>
        }
      >
        {(points) => <RevenueChart points={points} granularity={granularity} />}
      </Block>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block fixed title="Đơn hàng theo trạng thái" state={byStatus} isEmpty={(d) => ORDER_STATUSES.every((s) => !d[s])} emptyText="Chưa có đơn hàng trong kỳ.">
          {(d) => <StatusBars data={d} />}
        </Block>
        <Block fixed title="Khách mua nhiều" state={topCustomers} isEmpty={(d) => d.length === 0} emptyText="Chưa có khách mua hàng trong kỳ.">
          {(items) => (
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Khách mua nhiều</caption>
              <thead className="sticky top-0 bg-paper text-xs uppercase text-muted">
                <tr><th scope="col" className="py-1 font-semibold">Người dùng</th><th scope="col" className="py-1 text-right font-semibold">Đơn</th><th scope="col" className="py-1 text-right font-semibold">Tổng chi</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((c) => (
                  <tr key={c.userId}>
                    <td className="py-1.5"><Link href={`/admin/customers/${c.userId}`} className="font-medium text-ink hover:text-gold-deep hover:underline">{c.fullName}</Link><div className="text-xs text-muted">{c.phone}</div></td>
                    <td className="py-1.5 text-right">{c.orders}</td>
                    <td className="py-1.5 text-right">{formatVND(c.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Block>
        <Block fixed title="Sản phẩm bán chạy" state={topProducts} isEmpty={(d) => d.length === 0} emptyText="Chưa có sản phẩm bán ra trong kỳ.">
          {(items) => (
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Sản phẩm bán chạy</caption>
              <thead className="sticky top-0 bg-paper text-xs uppercase text-muted">
                <tr><th scope="col" className="py-1 font-semibold">Sản phẩm</th><th scope="col" className="py-1 text-right font-semibold">SL</th><th scope="col" className="py-1 text-right font-semibold">Doanh thu</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((p) => (
                  <tr key={p.productCode}>
                    <td className="py-1.5">
                      {p.productId ? <Link href={`/admin/products/${p.productId}`} className="font-medium text-ink hover:text-gold-deep hover:underline">{p.productName}</Link> : <span className="font-medium">{p.productName}</span>}
                      <div className="font-mono text-xs text-muted">{p.productCode}</div>
                    </td>
                    <td className="py-1.5 text-right">{p.quantity}</td>
                    <td className="py-1.5 text-right">{formatVND(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Block>
        <Block fixed title="Tồn kho thấp" state={lowStock} isEmpty={(d) => d.length === 0} emptyText="Không có sản phẩm nào sắp hết hàng.">
          {(items) => (
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Biến thể tồn kho thấp</caption>
              <thead className="sticky top-0 bg-paper text-xs uppercase text-muted">
                <tr><th scope="col" className="py-1 font-semibold">Sản phẩm</th><th scope="col" className="py-1 font-semibold">SKU / Size</th><th scope="col" className="py-1 text-right font-semibold">Tồn</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((i) => (
                  <tr key={i.variantId}>
                    <td className="py-1.5"><Link href={`/admin/products/${i.productId}`} className="font-medium text-ink hover:text-gold-deep hover:underline">{i.productName}</Link></td>
                    <td className="py-1.5 text-xs text-muted">{i.sku}{i.size ? ` / ${i.size}` : ""}</td>
                    <td className={`py-1.5 text-right font-semibold ${i.stock === 0 ? "text-danger" : ""}`}>{i.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Block>
      </div>
    </div>
  );
}

function StatusBars({ data }: { data: OrdersByStatus }) {
  const max = Math.max(1, ...ORDER_STATUSES.map((s) => data[s] ?? 0));
  return (
    <ul className="space-y-2.5">
      {ORDER_STATUSES.map((s) => (
        <li key={s} className="grid grid-cols-[9.5rem_1fr_2.5rem] items-center gap-2 text-sm">
          <OrderStatusBadge status={s} />
          <div className="h-3 overflow-hidden rounded-full bg-sand" aria-hidden>
            <div className={`h-full rounded-full ${STATUS_BAR[s]}`} style={{ width: `${((data[s] ?? 0) / max) * 100}%` }} />
          </div>
          <span className="text-right font-semibold" data-testid={`status-count-${s}`}>{data[s] ?? 0}</span>
        </li>
      ))}
    </ul>
  );
}
