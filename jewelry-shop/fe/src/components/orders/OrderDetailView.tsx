"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductImage } from "@/components/product/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants";
import { useAsyncData } from "@/hooks/useAsyncData";
import { orderService } from "@/services/order.service";
import type { OrderDetail, PaymentInstructions } from "@/types/order";
import { copyText } from "@/utils/clipboard";
import { confirmWithReason } from "@/utils/confirm";
import { isApiError } from "@/utils/errors";
import { formatDateTime, formatVND } from "@/utils/format";
import { notify } from "@/utils/notify";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/utils/order";
import { artFor, metalFor } from "@/utils/product-art";
import { StatusBadge } from "./OrdersView";
import { ZaloPayBox } from "./ZaloPayBox";

function CopyRow({ label, value, copyLabel }: { label: string; value: string; copyLabel?: string }) {
  const onCopy = async () => {
    const ok = await copyText(value);
    notify(ok ? "success" : "error", ok ? "Đã sao chép" : "Không sao chép được, vui lòng chép thủ công");
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="flex items-center gap-2 font-medium text-ink">
        <span className="break-all">{value}</span>
        {copyLabel && (
          <Button size="sm" variant="secondary" onClick={onCopy} aria-label={copyLabel}>
            Sao chép
          </Button>
        )}
      </dd>
    </div>
  );
}

export function BankTransferBox({ info }: { info: PaymentInstructions }) {
  return (
    <section aria-label="Thông tin chuyển khoản" className="rounded-lg border border-gold bg-gold-tint p-4 sm:p-5">
      <h2 className="font-serif text-xl text-ink">Thông tin chuyển khoản</h2>
      <p className="mt-1 text-sm text-muted">Vui lòng chuyển khoản đúng số tiền và nội dung để đơn được xác nhận nhanh.</p>
      <dl className="mt-4 space-y-2.5 text-sm">
        <CopyRow label="Ngân hàng" value={info.bankName} />
        <CopyRow label="Số tài khoản" value={info.accountNumber} copyLabel="Sao chép số tài khoản" />
        <CopyRow label="Chủ tài khoản" value={info.accountHolder} />
        <CopyRow label="Số tiền" value={formatVND(info.amount)} />
        <CopyRow label="Nội dung chuyển khoản" value={info.transferContent} copyLabel="Sao chép nội dung chuyển khoản" />
      </dl>
    </section>
  );
}

function Timeline({ history }: { history: OrderDetail["history"] }) {
  return (
    <ol aria-label="Tiến trình đơn hàng" className="space-y-4">
      {history.map((h, i) => {
        const last = i === history.length - 1;
        // Mục ghi chú không đổi trạng thái đơn (ví dụ "ZaloPay: đã nhận thanh toán"): hiện ghi chú làm tiêu đề, không lặp tên trạng thái.
        const noteOnly = i > 0 && history[i - 1]?.status === h.status && !!h.note;
        return (
          <li key={`${h.status}-${h.createdAt}-${i}`} className="relative flex gap-3" aria-current={last ? "step" : undefined}>
            <span
              aria-hidden
              className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                last ? (h.status === "cancelled" ? "bg-danger" : "bg-gold-deep") : "bg-line-strong"
              }`}
            />
            <div className="text-sm">
              <p className={last ? "font-semibold text-ink" : "text-ink"}>
                {noteOnly ? h.note : (ORDER_STATUS_LABEL[h.status] ?? h.status)}
              </p>
              <p className="text-xs text-muted">{formatDateTime(h.createdAt)}</p>
              {!noteOnly && h.note && <p className="text-xs text-muted">{h.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetailView() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(String(params.code ?? ""));
  const justPlaced = useSearchParams().get("placed") === "1";
  const { data, loading, failed, reload } = useAsyncData(`order-${code}`, (signal) => orderService.get(code, signal));
  const [updated, setUpdated] = useState<OrderDetail | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const order = updated?.code === code ? updated : data;

  const cancel = async () => {
    if (cancelling || !order) return;
    const { confirmed, reason } = await confirmWithReason({
      title: "Hủy đơn hàng",
      text: `Bạn có chắc muốn hủy đơn ${order.code}? Thao tác này không thể hoàn tác.`,
      confirmText: "Hủy đơn",
      cancelText: "Giữ đơn",
    });
    if (!confirmed) return;
    setCancelling(true);
    try {
      setUpdated(await orderService.cancel(order.code, reason || undefined));
      notify("success", "Đã hủy đơn hàng");
    } catch (err) {
      if (isApiError(err) && err.code === "ORDER_NOT_CANCELLABLE") {
        notify("error", "Đơn hàng không còn ở trạng thái cho phép hủy.");
        setUpdated(null);
        reload();
      } else {
        notify("error", isApiError(err) ? err.message : "Không hủy được đơn hàng, vui lòng thử lại");
      }
    } finally {
      setCancelling(false);
    }
  };

  if (failed && !order) {
    return <ErrorState onRetry={reload} />;
  }
  if (loading && !order) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (!order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        action={<ButtonLink href={ROUTES.orders}>Xem đơn hàng của tôi</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-5">
      {justPlaced && (
        <div role="status" className="rounded-lg border border-success/40 bg-success/5 px-4 py-3 text-sm text-success">
          Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại cửa hàng.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper p-4 shadow-card">
        <div>
          <h2 className="text-xl font-semibold text-ink">Đơn {order.code}</h2>
          <p className="text-xs text-muted">Đặt lúc {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <Badge tone={order.paymentStatus === "paid" ? "success" : "neutral"}>{PAYMENT_STATUS_LABEL[order.paymentStatus]}</Badge>
          {order.status === "pending" && (
            <Button variant="secondary" size="sm" className="text-danger!" onClick={cancel} loading={cancelling}>
              Hủy đơn
            </Button>
          )}
        </div>
      </div>

      {order.status === "cancelled" && order.cancelReason && (
        <p className="text-sm text-muted">Lý do hủy: {order.cancelReason}</p>
      )}

      {order.paymentInstructions && <BankTransferBox info={order.paymentInstructions} />}

      {order.paymentMethod === "zalopay" && order.paymentStatus === "unpaid" && order.status !== "cancelled" && (
        <ZaloPayBox
          orderCode={order.code}
          onPaid={() => {
            setUpdated(null);
            reload();
          }}
        />
      )}

      {/* Lưới 2x2: hàng trên và hàng dưới mỗi hàng cao bằng nhau; danh sách bên trong tự cuộn khi dài hơn khung. */}
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:grid-rows-[16rem_15rem]">
        <section className="rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5 lg:flex lg:min-h-0 lg:flex-col">
          <h2 className="mb-3 shrink-0 font-serif text-xl">Sản phẩm</h2>
          <ul className="divide-y divide-line lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {order.items.map((it, i) => (
              <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-ui border border-line">
                  <ProductImage url={it.imageUrl} alt={it.productName} art={artFor(undefined)} metal={metalFor(undefined)} sizes="4rem" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  {it.productSlug ? (
                    <Link href={`/products/${it.productSlug}`} className="line-clamp-2 font-medium hover:text-gold-deep">
                      {it.productName}
                    </Link>
                  ) : (
                    <p className="line-clamp-2 font-medium">{it.productName}</p>
                  )}
                  <p className="text-xs text-muted">
                    Mã: {it.productCode}
                    {it.size ? ` · Size: ${it.size}` : ""} · {formatVND(it.unitPrice)} x {it.quantity}
                  </p>
                  {order.status === "delivered" && it.productSlug && (
                    <Link
                      href={`/products/${it.productSlug}#reviews`}
                      className="mt-1 inline-block text-xs font-medium text-gold-deep hover:underline"
                      aria-label={`Đánh giá ${it.productName}`}
                    >
                      Đánh giá
                    </Link>
                  )}
                </div>
                <p className="shrink-0 text-sm font-semibold">{formatVND(it.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5 lg:min-h-0">
          <h2 className="mb-3 font-serif text-xl">Thanh toán</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">Vận chuyển</dt><dd className="text-right">{order.shippingMethodName}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Thanh toán</dt><dd className="text-right">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Tạm tính</dt><dd>{formatVND(order.subtotal)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Phí vận chuyển</dt><dd>{formatVND(order.shippingFee)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-line pt-2 text-base"><dt className="font-medium">Tổng cộng</dt><dd className="font-semibold">{formatVND(order.total)}</dd></div>
          </dl>
        </section>
        <section className="rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5 lg:flex lg:min-h-0 lg:flex-col">
          <h2 className="mb-3 shrink-0 font-serif text-xl">Tiến trình</h2>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <Timeline history={order.history} />
          </div>
        </section>
        <section className="rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5 lg:flex lg:min-h-0 lg:flex-col">
          <h2 className="mb-3 shrink-0 font-serif text-xl">Địa chỉ nhận hàng</h2>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <p className="text-sm font-medium">{order.receiver.name} · {order.receiver.phone}</p>
          <p className="text-sm text-muted">
            {order.receiver.addressDetail}, {order.receiver.ward}, {order.receiver.province}
          </p>
          {order.note && <p className="mt-2 text-sm text-muted">Ghi chú: {order.note}</p>}
          </div>
        </section>
      </div>

      <Link href={ROUTES.orders} className="inline-block text-sm font-medium text-gold-deep hover:underline">
        Quay lại danh sách đơn hàng
      </Link>
    </div>
  );
}
