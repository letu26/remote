"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AddressForm } from "@/components/user/AddressForm";
import { ProductImage } from "@/components/product/ProductImage";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { inputClass } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useHydrated } from "@/hooks/useHydrated";
import { addressService } from "@/services/address.service";
import { orderService } from "@/services/order.service";
import { shippingService } from "@/services/shipping.service";
import { dropCartItems } from "@/store/cart-store";
import { clearCheckout, getCheckoutRaw, parseCheckoutIds, subscribeCheckout } from "@/store/checkout-store";
import type { OrderPreview, PaymentMethod, StockShortage } from "@/types/order";
import { cartErrorMessage } from "@/utils/cart-errors";
import { isApiError } from "@/utils/errors";
import { formatVND } from "@/utils/format";
import { createIdempotencyHolder } from "@/utils/idempotency";
import { notify } from "@/utils/notify";
import { PAYMENT_METHOD_LABEL } from "@/utils/order";
import { artFor, metalFor } from "@/utils/product-art";

export const NOTE_MAX = 500;
const ISSUE_TEXT = {
  UNAVAILABLE: "Ngừng bán",
  OUT_OF_STOCK: "Hết hàng",
  INSUFFICIENT_STOCK: "Không đủ tồn kho",
} as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5">
      <h2 className="mb-4 font-serif text-xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

const radioCard = (checked: boolean) =>
  `flex cursor-pointer items-start gap-3 rounded-ui border p-3 text-sm transition-colors ${
    checked ? "border-gold-deep bg-gold-tint" : "border-line hover:border-line-strong"
  }`;

export function CheckoutView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const raw = useSyncExternalStore(subscribeCheckout, getCheckoutRaw, () => null);
  const itemIds = useMemo(() => parseCheckoutIds(raw), [raw]);
  const itemsKey = itemIds.join(",");
  const placed = useRef(false);
  const lock = useRef(false);
  // Một Idempotency-Key cho mỗi lần mở trang; dùng lại khi bấm đặt lại.
  const [idem] = useState(() => createIdempotencyHolder());

  const addresses = useAsyncData("checkout-addresses", () => addressService.list());
  const shipping = useAsyncData("checkout-shipping", () => shippingService.list());
  const [addressId, setAddressId] = useState<number | null>(null);
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [note, setNote] = useState("");
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rev, setRev] = useState(0);

  const addressList = addresses.data ?? [];
  const methods = shipping.data ?? [];
  const effectiveAddress =
    addressId ?? addressList.find((a) => a.isDefault)?.id ?? addressList[0]?.id ?? null;
  const effectiveShipping = shippingId ?? methods[0]?.id ?? null;

  // Không còn dòng nào để thanh toán (mất sessionStorage, vào thẳng URL): về giỏ hàng.
  useEffect(() => {
    if (hydrated && itemIds.length === 0 && !placed.current) router.replace(ROUTES.cart);
  }, [hydrated, itemIds.length, router]);

  // Xem trước đơn: gọi lại khi đổi dòng, đổi vận chuyển hoặc sau PRICE_CHANGED.
  const previewKey = `${itemsKey}|${effectiveShipping ?? ""}|${rev}`;
  const [result, setResult] = useState<{ key: string; data?: OrderPreview; error?: unknown } | null>(null);
  const shippingReady = !shipping.loading;
  useEffect(() => {
    if (itemIds.length === 0 || !shippingReady) return;
    const controller = new AbortController();
    orderService
      .preview(itemIds, effectiveShipping ?? undefined, controller.signal)
      .then((data) => !controller.signal.aborted && setResult({ key: previewKey, data }))
      .catch((error) => !controller.signal.aborted && setResult({ key: previewKey, error }));
    return () => controller.abort();
    // `itemIds` đã được đại diện bởi previewKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey, shippingReady]);

  const preview = result?.data;
  const fresh = result?.key === previewKey;
  const hasIssues = (preview?.issues.length ?? 0) > 0;
  const issueByItem = new Map((preview?.issues ?? []).map((i) => [i.cartItemId, i]));

  const canOrder =
    !!preview && fresh && !hasIssues && effectiveAddress !== null && effectiveShipping !== null && !submitting;

  const placeOrder = async () => {
    if (lock.current || !canOrder || !preview || effectiveAddress === null || effectiveShipping === null) return;
    lock.current = true;
    setSubmitting(true);
    try {
      const order = await orderService.create(
        {
          itemIds,
          addressId: effectiveAddress,
          shippingMethodId: effectiveShipping,
          paymentMethod: payment,
          note: note.trim() || undefined,
          expectedTotal: preview.total,
        },
        idem.get(),
      );
      placed.current = true;
      clearCheckout();
      dropCartItems(itemIds);
      notify("success", "Đặt hàng thành công");
      router.replace(`${ROUTES.orders}/${encodeURIComponent(order.code)}?placed=1`);
    } catch (err) {
      handleOrderError(err);
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  };

  const handleOrderError = (err: unknown) => {
    if (!isApiError(err)) {
      notify("error", cartErrorMessage(err));
      return;
    }
    switch (err.code) {
      case "PRICE_CHANGED": {
        // Nội dung đơn đã đổi: key mới, tải lại preview và yêu cầu khách bấm đặt lại.
        idem.renew();
        setRev((r) => r + 1);
        const total = err.extra.total;
        notify(
          "warning",
          typeof total === "number"
            ? `Tổng tiền đã thay đổi thành ${formatVND(total)}. Vui lòng kiểm tra và bấm Đặt hàng lại.`
            : "Giá đã thay đổi. Vui lòng kiểm tra và bấm Đặt hàng lại.",
        );
        break;
      }
      case "INSUFFICIENT_STOCK": {
        idem.renew();
        const shortages = Array.isArray(err.extra.shortages) ? (err.extra.shortages as StockShortage[]) : [];
        const list = shortages
          .map((s) => `${s.productName}${s.size ? ` (size ${s.size})` : ""}: còn ${s.available}`)
          .join("; ");
        notify("error", list ? `Không đủ hàng: ${list}. Vui lòng điều chỉnh giỏ hàng.` : "Một số sản phẩm không đủ hàng.");
        router.push(ROUTES.cart);
        break;
      }
      case "ITEM_UNAVAILABLE":
        idem.renew();
        notify("error", "Có sản phẩm đã ngừng bán. Vui lòng kiểm tra lại giỏ hàng.");
        router.push(ROUTES.cart);
        break;
      case "REQUEST_IN_PROGRESS":
        // Cùng key đang được xử lý: không đặt lại ngay.
        notify("info", "Đơn đang được xử lý, vui lòng chờ trong giây lát.");
        break;
      default:
        notify("error", cartErrorMessage(err));
    }
  };

  if (!hydrated || itemIds.length === 0) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (result?.error && result.key === previewKey) {
    return (
      <ErrorState
        title="Không xem trước được đơn hàng"
        description={isApiError(result.error) ? result.error.message : undefined}
        onRetry={() => setRev((r) => r + 1)}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-5">
        <Section title="Sản phẩm">
          {!preview ? (
            <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {preview.items.map((it) => {
                const issue = issueByItem.get(it.cartItemId);
                return (
                  <li key={it.cartItemId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-ui border border-line">
                      <ProductImage url={it.imageUrl} alt={it.productName} art={artFor(undefined)} metal={metalFor(undefined)} sizes="4rem" />
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="line-clamp-2 font-medium text-ink">{it.productName}</p>
                      <p className="text-xs text-muted">
                        Mã: {it.productCode}
                        {it.size ? ` · Size: ${it.size}` : ""} · SL: {it.quantity}
                      </p>
                      <p className="text-xs text-muted">Đơn giá: {formatVND(it.unitPrice)}</p>
                      {issue && (
                        <p className="mt-1 inline-block rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                          {ISSUE_TEXT[issue.issue]}
                          {issue.available !== undefined ? ` (còn ${issue.available})` : ""}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{formatVND(it.lineTotal)}</p>
                  </li>
                );
              })}
            </ul>
          )}
          {hasIssues && (
            <p role="alert" className="mt-3 text-sm text-danger">
              Một số sản phẩm không còn đủ điều kiện mua.{" "}
              <Link href={ROUTES.cart} className="font-medium underline">Quay lại giỏ hàng</Link> để điều chỉnh.
            </p>
          )}
        </Section>

        <Section title="Địa chỉ nhận hàng">
          {addresses.loading ? (
            <Skeleton className="h-24 w-full" />
          ) : addresses.failed ? (
            <ErrorState title="Không tải được địa chỉ" onRetry={addresses.reload} />
          ) : addressList.length === 0 ? (
            <div className="space-y-3 rounded-ui border border-dashed border-line-strong p-4 text-center">
              <p className="text-sm text-muted">Bạn chưa có địa chỉ nhận hàng. Hãy thêm địa chỉ để đặt hàng.</p>
              <Button onClick={() => setAddressFormOpen(true)}>Thêm địa chỉ</Button>
            </div>
          ) : (
            <div className="space-y-2.5" role="radiogroup" aria-label="Địa chỉ nhận hàng">
              {addressList.map((a) => (
                <label key={a.id} className={radioCard(effectiveAddress === a.id)}>
                  <input
                    type="radio"
                    name="address"
                    checked={effectiveAddress === a.id}
                    onChange={() => setAddressId(a.id)}
                    className="mt-1 accent-gold-deep"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">
                      {a.receiverName} · {a.receiverPhone}
                      {a.isDefault && <span className="ml-2 text-xs font-semibold text-gold-deeper">Mặc định</span>}
                    </span>
                    <span className="block text-muted">{a.detail}, {a.wardName}, {a.provinceName}</span>
                  </span>
                </label>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setAddressFormOpen(true)}>
                Thêm địa chỉ mới
              </Button>
            </div>
          )}
        </Section>

        <Section title="Phương thức vận chuyển">
          {shipping.loading ? (
            <Skeleton className="h-16 w-full" />
          ) : shipping.failed ? (
            <ErrorState title="Không tải được phương thức vận chuyển" onRetry={shipping.reload} />
          ) : methods.length === 0 ? (
            <p className="text-sm text-danger">Hiện chưa có phương thức vận chuyển nào, vui lòng quay lại sau.</p>
          ) : (
            <div className="space-y-2.5" role="radiogroup" aria-label="Phương thức vận chuyển">
              {methods.map((m) => (
                <label key={m.id} className={radioCard(effectiveShipping === m.id)}>
                  <input
                    type="radio"
                    name="shipping"
                    checked={effectiveShipping === m.id}
                    onChange={() => setShippingId(m.id)}
                    className="mt-1 accent-gold-deep"
                  />
                  <span className="flex min-w-0 flex-1 justify-between gap-3">
                    <span>
                      <span className="block font-medium text-ink">{m.name}</span>
                      {m.description && <span className="block text-muted">{m.description}</span>}
                    </span>
                    <span className="shrink-0 font-semibold">{formatVND(m.fee)}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </Section>

        <Section title="Phương thức thanh toán">
          <div className="space-y-2.5" role="radiogroup" aria-label="Phương thức thanh toán">
            {(["cod", "bank_transfer", "zalopay"] as const).map((p) => (
              <label key={p} className={radioCard(payment === p)}>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === p}
                  onChange={() => setPayment(p)}
                  className="mt-1 accent-gold-deep"
                />
                <span>
                  <span className="block font-medium text-ink">{PAYMENT_METHOD_LABEL[p]}</span>
                  {p === "bank_transfer" && (
                    <span className="block text-muted">Bạn sẽ thấy thông tin chuyển khoản sau khi đặt hàng.</span>
                  )}
                  {p === "zalopay" && (
                    <span className="block text-muted">Bạn sẽ thấy mã QR để quét bằng app ZaloPay sau khi đặt hàng.</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Ghi chú">
          <label htmlFor="order-note" className="sr-only">Ghi chú cho đơn hàng</label>
          <textarea
            id="order-note"
            value={note}
            maxLength={NOTE_MAX}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Giao giờ hành chính"
            className={inputClass()}
          />
          <p className="mt-1 text-right text-xs text-muted" aria-live="polite">
            {note.length}/{NOTE_MAX}
          </p>
        </Section>
      </div>

      <aside aria-label="Tóm tắt đơn hàng" className="h-fit space-y-4 rounded-lg border border-line bg-paper p-5 shadow-card lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl">Tóm tắt đơn hàng</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Tạm tính</dt>
            <dd data-testid="subtotal">{preview ? formatVND(preview.subtotal) : "-"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Phí vận chuyển</dt>
            <dd data-testid="shipping-fee">{preview ? formatVND(preview.shippingFee) : "-"}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-3 text-base">
            <dt className="font-medium">Tổng cộng</dt>
            <dd data-testid="total" className="font-semibold text-ink">{preview ? formatVND(preview.total) : "-"}</dd>
          </div>
        </dl>
        {!fresh && preview && <p className="text-xs text-muted" aria-live="polite">Đang cập nhật giá...</p>}
        {!addresses.loading && addressList.length === 0 && (
          <p className="text-xs text-danger">Cần có địa chỉ nhận hàng để đặt hàng.</p>
        )}
        <Button className="w-full" onClick={placeOrder} loading={submitting} disabled={!canOrder}>
          {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
        </Button>
        <ButtonLink href={ROUTES.cart} variant="secondary" className="w-full">
          Quay lại giỏ hàng
        </ButtonLink>
      </aside>

      {addressFormOpen && (
        <AddressForm
          editing={null}
          isFirst={addressList.length === 0}
          onClose={() => setAddressFormOpen(false)}
          onSaved={() => {
            setAddressFormOpen(false);
            addresses.reload();
          }}
        />
      )}
    </div>
  );
}
