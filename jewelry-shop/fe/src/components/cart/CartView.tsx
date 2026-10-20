"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductImage } from "@/components/product/ProductImage";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Price } from "@/components/ui/Price";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants";
import {
  changeQuantity,
  loadCart,
  removeCartItems,
  useCartState,
} from "@/store/cart-store";
import { setCheckoutItems } from "@/store/checkout-store";
import type { CartItem } from "@/types/shop";
import { cartErrorMessage } from "@/utils/cart-errors";
import {
  ISSUE_LABEL,
  allSelected,
  isSelectable,
  maxQuantity,
  pruneSelection,
  selectedTotal,
  toggleAll,
  toggleOne,
} from "@/utils/cart-select";
import { confirmAction } from "@/utils/confirm";
import { formatVND } from "@/utils/format";
import { notify } from "@/utils/notify";
import { artFor, metalFor } from "@/utils/product-art";

function QuantityStepper({ item }: { item: CartItem }) {
  const max = maxQuantity(item);
  const disabled = !isSelectable(item);
  return (
    <div className="inline-flex items-center rounded-ui border border-line-strong bg-paper">
      <button
        type="button"
        aria-label={`Giảm số lượng ${item.productName}`}
        disabled={disabled || item.quantity <= 1}
        onClick={() => changeQuantity(item.id, item.quantity - 1)}
        className="h-9 w-9 text-lg hover:bg-sand disabled:opacity-40"
      >
        -
      </button>
      <span aria-live="polite" className="w-10 border-x border-line-strong text-center text-sm leading-9">
        {item.quantity}
      </span>
      <button
        type="button"
        aria-label={`Tăng số lượng ${item.productName}`}
        disabled={disabled || item.quantity >= max}
        onClick={() => changeQuantity(item.id, item.quantity + 1)}
        className="h-9 w-9 text-lg hover:bg-sand disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function CartRow({
  item,
  selected,
  onToggle,
  onRemove,
}: {
  item: CartItem;
  selected: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const ok = isSelectable(item);
  return (
    <li
      className={`flex gap-3 rounded-lg border border-line bg-paper p-3 shadow-card sm:gap-4 sm:p-4 ${ok ? "" : "bg-sand/60"}`}
      data-issue={item.issue ?? undefined}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={!ok}
        onChange={onToggle}
        aria-label={`Chọn ${item.productName}${item.size ? `, size ${item.size}` : ""}`}
        className="mt-1 h-4 w-4 shrink-0 accent-[#8c6a1c]"
      />
      <div className={`flex min-w-0 flex-1 gap-3 sm:gap-4 ${ok ? "" : "opacity-60"}`}>
        <Link
          href={`/products/${item.productSlug}`}
          className="relative block aspect-square w-20 shrink-0 overflow-hidden rounded-ui border border-line sm:w-24"
        >
          <ProductImage
            url={item.imageUrl}
            alt={item.productName}
            art={artFor(undefined)}
            metal={metalFor(undefined)}
            sizes="6rem"
          />
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <Link href={`/products/${item.productSlug}`} className="line-clamp-2 font-serif text-base leading-snug hover:text-gold-deep">
            {item.productName}
          </Link>
          <p className="text-xs text-muted">
            Mã: {item.productCode}
            {item.size ? ` · Size: ${item.size}` : ""}
          </p>
          <Price price={item.price} salePrice={item.salePrice} discountPercent={item.discountPercent} />
          {item.issue && (
            <p className="inline-block rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
              {ISSUE_LABEL[item.issue]}
              {item.issue === "INSUFFICIENT_STOCK" ? ` (còn ${item.stock})` : ""}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <p className={`text-sm font-semibold ${ok ? "text-ink" : "text-muted"}`}>{formatVND(item.lineTotal)}</p>
        <QuantityStepper item={item} />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Xóa ${item.productName} khỏi giỏ hàng`}
          className="text-xs text-danger hover:underline"
        >
          Xóa
        </button>
      </div>
    </li>
  );
}

export function CartView() {
  const router = useRouter();
  const { cart, status } = useCartState();
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadCart();
  }, []);

  // Giỏ đổi (xóa, hết hàng...): bỏ các dòng không còn chọn được khi hiển thị.
  const items = cart?.items;
  const sel = useMemo(() => (items ? pruneSelection(selected, items) : selected), [selected, items]);

  const remove = async (ids: number[], title: string, text: string) => {
    if (busy || ids.length === 0) return;
    const ok = await confirmAction({ title, text, confirmText: "Xóa", tone: "danger" });
    if (!ok) return;
    setBusy(true);
    try {
      await removeCartItems(ids);
      notify("success", ids.length === 1 ? "Đã xóa sản phẩm khỏi giỏ hàng" : `Đã xóa ${ids.length} sản phẩm khỏi giỏ hàng`);
    } catch (err) {
      notify("error", cartErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (status === "error" && !cart) return <ErrorState onRetry={() => void loadCart()} />;
  if (!cart) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải giỏ hàng">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Giỏ hàng của bạn đang trống"
        description="Hãy khám phá những mẫu trang sức đá quý của chúng tôi."
        action={<ButtonLink href={ROUTES.products}>Tiếp tục mua sắm</ButtonLink>}
      />
    );
  }

  const total = selectedTotal(sel, cart.items);
  const everything = allSelected(sel, cart.items);
  const selectedCount = sel.size;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section aria-label="Sản phẩm trong giỏ" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              checked={everything}
              onChange={() => setSelected(toggleAll(sel, cart.items))}
              className="h-4 w-4 accent-[#8c6a1c]"
            />
            Chọn tất cả ({cart.itemCount})
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger!"
            disabled={selectedCount === 0 || busy}
            onClick={() =>
              remove([...sel], "Xóa sản phẩm đã chọn", `Bạn có chắc muốn xóa ${selectedCount} sản phẩm đã chọn khỏi giỏ hàng?`)
            }
          >
            Xóa đã chọn{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </Button>
        </div>
        {cart.hasIssues && (
          <p className="text-sm text-muted">
            Một số sản phẩm không còn đủ điều kiện mua. Bạn có thể xóa chúng hoặc đợi hàng về.
          </p>
        )}
        <ul className="space-y-3">
          {cart.items.map((item) => (
            <CartRow
              key={item.id}
              item={item}
              selected={sel.has(item.id)}
              onToggle={() => setSelected(toggleOne(sel, item))}
              onRemove={() =>
                remove([item.id], "Xóa sản phẩm", `Bạn có chắc muốn xóa "${item.productName}" khỏi giỏ hàng?`)
              }
            />
          ))}
        </ul>
      </section>

      <aside aria-label="Tóm tắt đơn hàng" className="h-fit space-y-4 rounded-lg border border-line bg-paper p-5 shadow-card lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl">Tóm tắt</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Đã chọn</dt>
            <dd>{selectedCount} sản phẩm</dd>
          </div>
          <div className="flex justify-between gap-3 text-base">
            <dt className="font-medium">Tạm tính</dt>
            <dd data-testid="selected-total" className="font-semibold text-ink">{formatVND(total)}</dd>
          </div>
          <p className="text-xs text-muted">Phí vận chuyển: tính ở bước thanh toán</p>
        </dl>
        <Button
          className="w-full"
          disabled={selectedCount === 0 || busy}
          aria-describedby="checkout-note"
          onClick={() => {
            // Chỉ các dòng chọn được (không có vấn đề) nằm trong tập chọn.
            setCheckoutItems([...sel]);
            router.push(ROUTES.checkout);
          }}
        >
          Thanh toán
        </Button>
        {selectedCount === 0 && (
          <p id="checkout-note" className="text-center text-xs text-muted">Hãy chọn sản phẩm để thanh toán</p>
        )}
        <ButtonLink href={ROUTES.products} variant="secondary" className="w-full">
          Tiếp tục mua sắm
        </ButtonLink>
      </aside>
    </div>
  );
}
