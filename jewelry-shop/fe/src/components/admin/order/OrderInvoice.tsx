"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { BRAND_NAME, BRAND_TAGLINE } from "@/constants";
import { adminSiteInfoService } from "@/services/admin-cms.service";
import { adminOrderService } from "@/services/admin-order.service";
import type { SiteInfo } from "@/types/admin-cms";
import type { AdminOrderDetail } from "@/types/admin-order";
import { formatVND } from "@/utils/format";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, formatDateTime } from "./order-meta";

const PRINT_CSS = `
@page { size: A4; margin: 12mm; }
@media print {
  html, body { background: #fff !important; }
  .invoice-sheet { box-shadow: none !important; border: 0 !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }
}`;

export function OrderInvoice({ orderId }: { orderId: number }) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [site, setSite] = useState<SiteInfo | null>(null);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setOrder(await adminOrderService.get(orderId));
    } catch {
      setFailed(true);
    }
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu lần đầu
    void load();
    // Thông tin cửa hàng: lỗi thì dùng hằng số dự phòng.
    adminSiteInfoService.getPublic().then(setSite).catch(() => {});
  }, [load]);

  return (
    <div className="min-h-screen bg-sand/60 px-4 py-6 print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/admin/orders/${orderId}`} className="text-sm text-gold-deep hover:underline">
          &larr; Quay lại đơn hàng
        </Link>
        <Button onClick={() => window.print()} disabled={!order}>
          In hóa đơn
        </Button>
      </div>

      {failed && (
        <div className="mx-auto max-w-[210mm] print:hidden">
          <ErrorState onRetry={load} />
        </div>
      )}
      {!failed && !order && (
        <div className="mx-auto max-w-[210mm] space-y-3" aria-busy="true" aria-label="Đang tải">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {order && <InvoiceSheet order={order} site={site} />}
    </div>
  );
}

export function InvoiceSheet({ order, site }: { order: AdminOrderDetail; site?: SiteInfo | null }) {
  const r = order.receiver;
  const brand = site?.brandName?.trim() || BRAND_NAME;
  const slogan = site?.slogan?.trim() || BRAND_TAGLINE;
  return (
    <article
      aria-label={`Hóa đơn ${order.code}`}
      className="invoice-sheet mx-auto max-w-[210mm] rounded-lg border border-line bg-white p-8 text-[13px] text-ink shadow-card"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">{brand}</h1>
          <p className="text-xs text-muted">{slogan}</p>
          {site?.address && <p className="mt-1 text-xs">{site.address}</p>}
          {(site?.hotline || site?.email) && (
            <p className="text-xs">
              {site?.hotline && <span>Hotline: {site.hotline}</span>}
              {site?.hotline && site?.email && " · "}
              {site?.email && <span>Email: {site.email}</span>}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl uppercase tracking-wide">Hóa đơn bán hàng</p>
          <p className="font-mono text-sm font-semibold">{order.code}</p>
          <p className="text-xs text-muted">Ngày đặt: {formatDateTime(order.createdAt)}</p>
        </div>
      </header>

      <section className="grid gap-4 py-4 sm:grid-cols-2 print:grid-cols-2">
        <div>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Người dùng</h2>
          <p className="font-medium">{order.customer.fullName}</p>
          <p>{order.customer.phone}</p>
          {order.customer.email && <p>{order.customer.email}</p>}
        </div>
        <div>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Người nhận</h2>
          <p className="font-medium">{r.name}</p>
          <p>{r.phone}</p>
          <p>{[r.addressDetail, r.ward, r.province].filter(Boolean).join(", ")}</p>
        </div>
      </section>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-y border-line-strong bg-sand text-xs uppercase">
            <th scope="col" className="px-2 py-2 font-semibold">Sản phẩm</th>
            <th scope="col" className="px-2 py-2 font-semibold">Size</th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">SL</th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">Đơn giá</th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i} className="border-b border-line">
              <td className="px-2 py-2">
                <div className="font-medium">{it.productName}</div>
                <div className="text-xs text-muted">{it.productCode}</div>
              </td>
              <td className="px-2 py-2">{it.size || "-"}</td>
              <td className="px-2 py-2 text-right">{it.quantity}</td>
              <td className="px-2 py-2 text-right">{formatVND(it.unitPrice)}</td>
              <td className="px-2 py-2 text-right">{formatVND(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 max-w-xs space-y-1">
        <div className="flex justify-between">
          <dt>Tạm tính</dt>
          <dd>{formatVND(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Phí vận chuyển ({order.shippingMethodName})</dt>
          <dd>{formatVND(order.shippingFee)}</dd>
        </div>
        <div className="flex justify-between border-t border-line-strong pt-1 text-base font-bold">
          <dt>Tổng cộng</dt>
          <dd>{formatVND(order.total)}</dd>
        </div>
      </dl>

      <footer className="mt-6 grid gap-1 border-t border-line pt-4 text-xs">
        <p>
          <span className="text-muted">Phương thức thanh toán: </span>
          {PAYMENT_METHOD_LABEL[order.paymentMethod]}
        </p>
        <p>
          <span className="text-muted">Trạng thái thanh toán: </span>
          {PAYMENT_STATUS_LABEL[order.paymentStatus]}
        </p>
        <p>
          <span className="text-muted">Trạng thái đơn: </span>
          {ORDER_STATUS_LABEL[order.status]}
        </p>
        <p className="mt-3 text-center text-muted">Cảm ơn quý khách đã mua sắm tại {brand}.</p>
      </footer>
    </article>
  );
}
