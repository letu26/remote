"use client";

import { useEffect, useState } from "react";
import { ChevronIcon } from "@/components/ui/Icons";
import { SmartLink } from "@/components/ui/SmartLink";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Banner } from "@/types/cms";
import { isSafeLink } from "@/utils/cms";

export const CAROUSEL_INTERVAL_MS = 6000;

/**
 * Băng chuyền banner trang chủ: tự chạy chậm, nút trước/sau và chấm chuyển, tạm dừng khi rê chuột
 * hoặc focus, dừng hẳn khi hệ điều hành bật giảm chuyển động. Khung có tỉ lệ cố định để không nhảy bố cục.
 */
export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const count = banners.length;
  const current = count > 0 ? index % count : 0;
  const auto = count > 1 && !reduced && !hovered && !focused;

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), CAROUSEL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [auto, count]);

  if (count === 0) return null;
  const go = (n: number) => setIndex(((n % count) + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Banner nổi bật"
      className="relative border-b border-line bg-sand"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="relative mx-auto aspect-[16/9] max-h-[32rem] w-full max-w-7xl overflow-hidden sm:aspect-[21/9]">
        <div aria-live={auto ? "off" : "polite"}>
          {banners.map((b, i) => {
            const active = i === current;
            const img = (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh banner do admin tải lên, kích thước không biết trước
              <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
            );
            return (
              <div
                key={b.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${count}`}
                aria-hidden={!active}
                className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${
                  active ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {b.linkUrl && isSafeLink(b.linkUrl) ? (
                  <SmartLink href={b.linkUrl} className="block h-full w-full">
                    {img}
                  </SmartLink>
                ) : (
                  img
                )}
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Banner trước"
              onClick={() => go(current - 1)}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink shadow-card hover:bg-paper"
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              aria-label="Banner sau"
              onClick={() => go(current + 1)}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink shadow-card hover:bg-paper"
            >
              <ChevronIcon dir="right" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Chuyển tới banner ${i + 1}`}
                  aria-current={i === current}
                  onClick={() => go(i)}
                  className={`h-2.5 w-2.5 rounded-full border border-white/80 shadow ${i === current ? "bg-gold-deep" : "bg-paper/70"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
