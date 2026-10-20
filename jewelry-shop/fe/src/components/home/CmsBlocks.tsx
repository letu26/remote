"use client";

import { ArticleCard } from "@/components/content/ArticleCard";
import { SmartLink } from "@/components/ui/SmartLink";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { cmsService } from "@/services/cms.service";
import { isSafeLink } from "@/utils/cms";
import { HeroCarousel } from "./HeroCarousel";
import { Hero, Section, SectionHeading } from "./HomeSections";

/** Băng chuyền `home_hero`; chưa có banner (hoặc lỗi/đang tải) thì giữ hero tĩnh. */
export function HeroBlock() {
  const { data } = useAsyncData("banners-home_hero", (signal) => cmsService.banners("home_hero", signal));
  const banners = (data ?? []).filter((b) => typeof b.imageUrl === "string" && b.imageUrl.startsWith("https://"));
  return banners.length > 0 ? <HeroCarousel banners={banners} /> : <Hero />;
}

/** Lưới ô quảng cáo nhỏ `home_promo`; ẩn nếu không có. */
export function PromoBlock() {
  const { data } = useAsyncData("banners-home_promo", (signal) => cmsService.banners("home_promo", signal));
  const promos = (data ?? []).filter((b) => typeof b.imageUrl === "string" && b.imageUrl.startsWith("https://"));
  if (promos.length === 0) return null;
  return (
    <Section>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promos.map((b) => {
          // eslint-disable-next-line @next/next/no-img-element -- ảnh banner do admin tải lên
          const img = <img src={b.imageUrl} alt={b.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />;
          return (
            <li key={b.id} className="overflow-hidden rounded-lg border border-line shadow-card">
              {b.linkUrl && isSafeLink(b.linkUrl) ? <SmartLink href={b.linkUrl} className="block">{img}</SmartLink> : img}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** "Cẩm nang trang sức": 3 bài mới nhất; ẩn nếu rỗng hoặc lỗi. */
export function ArticlesBlock() {
  const { data, loading, failed } = useAsyncData("home-articles", (signal) =>
    cmsService.articles({ page: 1, pageSize: 3 }, signal),
  );
  if (failed || (data && data.items.length === 0)) return null;
  return (
    <Section>
      <SectionHeading title="Cẩm nang trang sức" kicker="Kiến thức hữu ích" href="/articles" />
      {loading || !data ? (
        <div role="status" aria-label="Đang tải bài viết" className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((a) => (
            <li key={a.id}><ArticleCard article={a} /></li>
          ))}
        </ul>
      )}
    </Section>
  );
}
