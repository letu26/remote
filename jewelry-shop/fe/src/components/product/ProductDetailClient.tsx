"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CartIcon } from "@/components/ui/Icons";
import { RING_SIZE_GUIDE } from "@/constants/catalog";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { addToCart } from "@/store/cart-store";
import { cartErrorMessage } from "@/utils/cart-errors";
import type { ProductDetail, ProductImageItem, ProductVariant } from "@/types/catalog";
import { artFor, metalFor } from "@/utils/product-art";
import { notify } from "@/utils/notify";
import { ProductImage } from "./ProductImage";
import { WishlistButton } from "./WishlistButton";

/** Ảnh chính (isPrimary) lên đầu, còn lại theo sortOrder. */
export function orderImages(images: ProductImageItem[]): ProductImageItem[] {
  return [...images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder || a.id - b.id,
  );
}

/** Bộ ảnh: ảnh chính + thumbnail. Chưa có ảnh thì dùng ảnh minh họa mặc định. */
export function ProductGallery({ product }: { product: ProductDetail }) {
  const [active, setActive] = useState(0);
  const images = orderImages(product.images);
  const art = artFor(product.category.slug, product.gemstones[0]?.name);
  const metal = metalFor(product.material?.name);
  const current = images[active] ?? images[0];
  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line shadow-card">
        <ProductImage
          key={current?.id ?? "art"}
          url={current?.url}
          alt={`${product.name}${images.length > 1 ? ` - ảnh ${active + 1}` : ""}`}
          art={art}
          metal={metal}
          sizes="(min-width: 1024px) 40rem, 100vw"
          priority
        />
        <WishlistButton productId={product.id} name={product.name} className="absolute right-3 top-3" />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-pressed={active === i}
                className={`relative block aspect-square w-full overflow-hidden rounded-ui border-2 ${
                  active === i ? "border-gold-deep" : "border-line hover:border-line-strong"
                }`}
              >
                <ProductImage url={img.url} alt={`Ảnh nhỏ ${i + 1}`} art={art} metal={metal} variant={i} sizes="8rem" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Chọn size, số lượng, Thêm vào giỏ / Mua ngay. Size hết hàng bị vô hiệu hóa. */
export function ProductBuyBox({ product }: { product: ProductDetail }) {
  const variants: ProductVariant[] = product.variants;
  const needsSize = variants.some((v) => v.size !== "");
  const totalStock = variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const soldOut = !product.inStock || totalStock <= 0;
  const available = needsSize ? (selected ? selected.stock : totalStock) : totalStock;

  const router = useRouter();
  const requireLogin = useRequireLogin();
  const [busy, setBusy] = useState(false);
  // Không cần chọn size: dùng biến thể còn hàng đầu tiên.
  const target = needsSize ? selected : (variants.find((v) => v.stock > 0) ?? variants[0] ?? null);

  /** Thêm vào giỏ theo size và số lượng đã chọn. Trả về true nếu thành công. */
  const add = async (): Promise<boolean> => {
    if (busy) return false;
    if (!requireLogin()) return false;
    if (needsSize && !selected) {
      setSizeError(true);
      return false;
    }
    if (!target) return false;
    setBusy(true);
    try {
      await addToCart(target.id, qty);
      return true;
    } catch (err) {
      notify("error", cartErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {needsSize && (
        <fieldset>
          <legend className="mb-2 flex w-full items-center justify-between text-sm font-medium text-ink">
            <span>Chọn size</span>
            <button
              type="button"
              aria-expanded={guideOpen}
              aria-controls="huong-dan-size"
              onClick={() => setGuideOpen((v) => !v)}
              className="text-xs font-normal text-gold-deep underline"
            >
              Hướng dẫn đo size
            </button>
          </legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const out = v.stock <= 0;
              return (
                <label key={v.id} className={out ? "cursor-not-allowed" : "cursor-pointer"} title={out ? "Hết hàng" : undefined}>
                  <input
                    type="radio"
                    name="size"
                    value={v.size}
                    disabled={out}
                    checked={selectedId === v.id}
                    onChange={() => {
                      setSelectedId(v.id);
                      setQty((q) => Math.max(1, Math.min(q, v.stock)));
                      setSizeError(false);
                    }}
                    className="peer sr-only"
                  />
                  <span
                    className={`flex h-10 min-w-12 items-center justify-center rounded-ui border px-3 text-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep ${
                      out
                        ? "border-line bg-sand/60 text-muted/60 line-through"
                        : "border-line-strong bg-paper peer-checked:border-gold-deep peer-checked:bg-gold-deep peer-checked:text-white"
                    }`}
                  >
                    {v.size}
                  </span>
                </label>
              );
            })}
          </div>
          {sizeError && (
            <p role="alert" className="mt-2 text-xs text-danger">
              Vui lòng chọn size trước khi tiếp tục.
            </p>
          )}
          <div id="huong-dan-size" hidden={!guideOpen} className="mt-3 rounded-lg border border-line bg-sand/60 p-4 text-sm">
            <p className="mb-2 font-medium text-ink">Cách đo size</p>
            <p className="mb-2 text-xs">
              <Link href="/pages/huong-dan-do-size" className="text-gold-deep underline">Xem hướng dẫn đo size chi tiết</Link>
            </p>
            <p className="mb-3 text-muted">
              Quấn một sợi chỉ hoặc thước dây giấy quanh ngón tay (hoặc cổ tay), đánh dấu điểm giao nhau rồi đo chiều
              dài bằng thước để đối chiếu bảng dưới đây. Nên đo vào cuối ngày khi ngón tay ở kích thước lớn nhất.
            </p>
            <table className="w-full max-w-xs text-left text-xs">
              <caption className="sr-only">Bảng quy đổi size nhẫn</caption>
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="py-1">Chu vi ngón tay (mm)</th>
                  <th scope="col" className="py-1">Size nhẫn</th>
                </tr>
              </thead>
              <tbody>
                {RING_SIZE_GUIDE.map((r) => (
                  <tr key={r.size} className="border-t border-line">
                    <td className="py-1">{r.circumference}</td>
                    <td className="py-1">{r.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="qty" className="sr-only">Số lượng</label>
          <div className="inline-flex items-center rounded-ui border border-line-strong bg-paper">
            <button type="button" aria-label="Giảm số lượng" disabled={qty <= 1 || soldOut}
              onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-10 w-10 text-lg hover:bg-sand disabled:opacity-40">-</button>
            <input id="qty" readOnly value={qty} className="h-10 w-12 border-x border-line-strong bg-transparent text-center text-sm" />
            <button type="button" aria-label="Tăng số lượng" disabled={qty >= available || soldOut}
              onClick={() => setQty((q) => Math.min(available, q + 1))} className="h-10 w-10 text-lg hover:bg-sand disabled:opacity-40">+</button>
          </div>
        </div>
        <p className={`text-sm ${soldOut ? "text-danger" : "text-success"}`}>
          {soldOut
            ? "Hết hàng"
            : needsSize && !selected
              ? "Chọn size để xem tồn kho"
              : available <= 3
                ? `Chỉ còn ${available} sản phẩm`
                : `Còn hàng (${available})`}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="secondary"
          size="lg"
          disabled={soldOut}
          loading={busy}
          className="flex-1"
          onClick={async () => (await add()) && notify("success", `Đã thêm "${product.name}" vào giỏ hàng`)}
        >
          <CartIcon width={18} height={18} />
          Thêm vào giỏ hàng
        </Button>
        <Button
          size="lg"
          disabled={soldOut || busy}
          className="flex-1"
          onClick={async () => (await add()) && router.push("/cart")}
        >
          Mua ngay
        </Button>
      </div>
    </div>
  );
}
