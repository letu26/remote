"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminOrderService } from "@/services/admin-order.service";
import type { AdminOrderDetail } from "@/types/admin-order";
import { isApiError } from "@/utils/errors";
import { confirmWithNote } from "@/utils/confirm-note";
import { formatVND } from "@/utils/format";
import { notify } from "@/utils/notify";
import { adminErrorMessage } from "../admin-errors";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderBadges";
import {
  NEXT_STATUS_ACTION,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  canCancel,
  canChangePayment,
  formatDateTime,
  nextStatus,
} from "./order-meta";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-paper p-4 shadow-card">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      <div className="mt-3 text-sm">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

export function OrderDetail({ orderId }: { orderId: number }) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

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
  }, [load]);

  /** Chạy một thao tác ghi; INVALID_STATUS_TRANSITION thì tải lại đơn và báo. */
  const run = async (action: () => Promise<AdminOrderDetail>, success: string) => {
    setBusy(true);
    try {
      setOrder(await action());
      notify("success", success);
    } catch (e) {
      notify("error", adminErrorMessage(e));
      if (isApiError(e) && e.code === "INVALID_STATUS_TRANSITION") await load();
    } finally {
      setBusy(false);
    }
  };

  if (failed) return <ErrorState onRetry={load} />;
  if (!order)
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  const next = nextStatus(order.status);

  const moveTo = async () => {
    if (!next) return;
    const note = await confirmWithNote({
      title: NEXT_STATUS_ACTION[next],
      text: `Chuyển đơn ${order.code} sang trạng thái "${ORDER_STATUS_LABEL[next]}"?`,
      confirmText: NEXT_STATUS_ACTION[next],
    });
    if (note === null) return;
    await run(() => adminOrderService.changeStatus(order.id, next, note || undefined), `Đã chuyển sang "${ORDER_STATUS_LABEL[next]}"`);
  };

  const cancel = async () => {
    const note = await confirmWithNote({
      title: "Hủy đơn hàng",
      text: `Hủy đơn ${order.code}? Tồn kho sẽ được hoàn lại và không thể hoàn tác.`,
      confirmText: "Hủy đơn",
      tone: "danger",
      placeholder: "Lý do hủy (tùy chọn)",
    });
    if (note === null) return;
    await run(() => adminOrderService.changeStatus(order.id, "cancelled", note || undefined), "Đã hủy đơn hàng");
  };

  const togglePayment = async () => {
    const target = order.paymentStatus === "paid" ? "unpaid" : "paid";
    const note = await confirmWithNote({
      title: target === "paid" ? "Xác nhận đã thanh toán" : "Hủy xác nhận thanh toán",
      text: target === "paid" ? `Xác nhận đã nhận đủ ${formatVND(order.total)} cho đơn ${order.code}?` : `Đặt đơn ${order.code} về "Chưa thanh toán"?`,
      confirmText: target === "paid" ? "Xác nhận đã thanh toán" : "Hủy xác nhận",
      tone: target === "paid" ? "default" : "danger",
    });
    if (note === null) return;
    await run(
      () => adminOrderService.changePayment(order.id, target, note || undefined),
      target === "paid" ? "Đã xác nhận thanh toán" : "Đã hủy xác nhận thanh toán",
    );
  };

  const r = order.receiver;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/orders" className="text-sm text-gold-deep hover:underline">&larr; Quay lại danh sách</Link>
        <ButtonLink href={`/admin/orders/${order.id}/invoice`} variant="secondary" size="sm">In hóa đơn</ButtonLink>
      </div>

      <section className="rounded-lg border border-line bg-paper p-4 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-lg font-semibold text-ink">{order.code}</p>
            <p className="text-xs text-muted">Đặt lúc {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
        {(next || canCancel(order.status) || canChangePayment(order)) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            {next && <Button onClick={moveTo} disabled={busy}>{NEXT_STATUS_ACTION[next]}</Button>}
            {canChangePayment(order) && (
              <Button variant="secondary" onClick={togglePayment} disabled={busy}>
                {order.paymentStatus === "paid" ? "Hủy xác nhận thanh toán" : "Xác nhận đã thanh toán"}
              </Button>
            )}
            {canCancel(order.status) && (
              <Button variant="ghost" className="text-danger! hover:bg-danger/10!" onClick={cancel} disabled={busy}>Hủy đơn</Button>
            )}
          </div>
        )}
        {order.status === "cancelled" && order.cancelReason && (
          <p className="mt-3 text-sm text-danger">Lý do hủy: {order.cancelReason}</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Khách hàng">
          <dl>
            <Row label="Họ tên">{order.customer.fullName}</Row>
            <Row label="Số điện thoại">{order.customer.phone}</Row>
            <Row label="Email">{order.customer.email ?? "-"}</Row>
          </dl>
        </Card>
        <Card title="Người nhận">
          <dl>
            <Row label="Họ tên">{r.name}</Row>
            <Row label="Số điện thoại">{r.phone}</Row>
            <Row label="Địa chỉ">{[r.addressDetail, r.ward, r.province].filter(Boolean).join(", ")}</Row>
            {order.note && <Row label="Ghi chú của khách">{order.note}</Row>}
          </dl>
        </Card>
      </div>

      <Card title="Sản phẩm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 text-left">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="py-2 font-semibold">Sản phẩm</th>
                <th scope="col" className="py-2 text-right font-semibold">Đơn giá</th>
                <th scope="col" className="py-2 text-right font-semibold">SL</th>
                <th scope="col" className="py-2 text-right font-semibold">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2">
                    <div className="flex items-center gap-2.5">
                      {it.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- ảnh bên ngoài, trang quản trị
                        <img src={it.imageUrl} alt="" className="h-10 w-10 rounded-ui border border-line object-cover" loading="lazy" />
                      )}
                      <div>
                        <div className="font-medium text-ink">{it.productName}</div>
                        <div className="text-xs text-muted">{it.productCode}{it.size ? ` · Size ${it.size}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-right">{formatVND(it.unitPrice)}</td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right font-medium">{formatVND(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-3 ml-auto max-w-xs border-t border-line pt-2">
          <Row label="Tạm tính">{formatVND(order.subtotal)}</Row>
          <Row label={`Phí vận chuyển (${order.shippingMethodName})`}>{formatVND(order.shippingFee)}</Row>
          <div className="flex justify-between gap-4 pt-1 text-base font-semibold text-ink">
            <dt>Tổng cộng</dt>
            <dd>{formatVND(order.total)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Thanh toán">
          <dl>
            <Row label="Phương thức">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</Row>
            <Row label="Trạng thái"><PaymentStatusBadge status={order.paymentStatus} /></Row>
            {order.paidAt && <Row label="Thanh toán lúc">{formatDateTime(order.paidAt)}</Row>}
          </dl>
        </Card>
        <Card title="Lịch sử đơn hàng">
          {order.history.length === 0 ? (
            <p className="text-muted">Chưa có lịch sử.</p>
          ) : (
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {order.history.map((h, i) => (
                <li key={i} className="relative">
                  <span aria-hidden className="absolute -left-5.25 top-1.5 h-2.5 w-2.5 rounded-full bg-gold-deep" />
                  <p className="font-medium text-ink">{ORDER_STATUS_LABEL[h.status]}</p>
                  <p className="text-xs text-muted">{formatDateTime(h.createdAt)} · {h.changedByName ?? "Hệ thống"}</p>
                  {h.note && <p className="mt-0.5 text-sm text-ink">{h.note}</p>}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
