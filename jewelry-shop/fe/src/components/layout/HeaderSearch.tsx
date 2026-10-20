"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { SearchIcon } from "@/components/ui/Icons";
import { ProductImage } from "@/components/product/ProductImage";
import { useDebounce } from "@/hooks/useDebounce";
import { suggestProducts } from "@/services/product.service";
import type { ProductSummary } from "@/types/catalog";
import { formatVND } from "@/utils/format";
import { artFor } from "@/utils/product-art";

export function HeaderSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ q: string; items: ProductSummary[] } | null>(null);
  const box = useRef<HTMLFormElement>(null);
  const inputId = useId();

  // Chỉ gọi tìm kiếm khi người dùng ngừng gõ 500ms.
  const debounced = useDebounce(text.trim(), 500);

  useEffect(() => {
    if (debounced.length < 2) return;
    const controller = new AbortController();
    const done = (items: ProductSummary[]) => !controller.signal.aborted && setResult({ q: debounced, items });
    suggestProducts(debounced, controller.signal)
      .then(done)
      .catch(() => done([]));
    return () => controller.abort();
  }, [debounced]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(q)}`);
  };

  const searching = text.trim().length >= 2 && (debounced !== text.trim() || result?.q !== debounced);
  const showPanel = open && text.trim().length >= 2;

  return (
    <form
      ref={box}
      role="search"
      onSubmit={submit}
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      className={`relative ${className}`}
    >
      <label htmlFor={inputId} className="sr-only">
        Tìm kiếm sản phẩm
      </label>
      <input
        id={inputId}
        type="search"
        autoComplete="off"
        value={text}
        placeholder="Tìm nhẫn, dây chuyền, kim cương..."
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-full border border-line-strong bg-paper py-2.5 pl-4 pr-11 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-gold-deep focus:ring-2 focus:ring-gold/30"
      />
      <button
        type="submit"
        aria-label="Tìm kiếm"
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-gold-deep text-white hover:bg-gold-deeper"
      >
        <SearchIcon width={16} height={16} />
      </button>

      {showPanel && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-lg border border-line bg-paper shadow-pop"
          aria-live="polite"
        >
          {searching ? (
            <p className="px-4 py-3 text-sm text-muted">Đang tìm...</p>
          ) : result && result.items.length > 0 ? (
            <ul>
              {result.items.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gold-tint"
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-ui">
                      <ProductImage url={p.primaryImageUrl} alt={p.name} art={artFor(p.category.slug)} metal="vang" sizes="44px" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">{p.name}</span>
                      <span className="text-xs text-muted">{formatVND(p.salePrice ?? p.price)}</span>
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-line">
                <button type="submit" className="w-full px-4 py-2.5 text-left text-sm text-gold-deep hover:bg-gold-tint">
                  Xem tất cả kết quả cho &ldquo;{debounced}&rdquo;
                </button>
              </li>
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-muted">Không tìm thấy sản phẩm phù hợp.</p>
          )}
        </div>
      )}
    </form>
  );
}
