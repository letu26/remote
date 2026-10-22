"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ProductArt } from "@/components/product/ProductArt";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getCategories, getCollections, listProducts } from "@/services/product.service";
import type { ArtSpec, MetalSlug, ProductListParams } from "@/types/catalog";
import { artFor } from "@/utils/product-art";
import { Section, SectionHeading } from "./HomeSections";

/** Mỗi khối tự tải dữ liệu và tự xử lý loading/lỗi, nên một khối lỗi không làm hỏng cả trang. */
function BlockError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <ErrorState
      title={`Không tải được "${title}"`}
      description="Vui lòng thử lại."
      onRetry={onRetry}
    />
  );
}

export function ProductBlock({
  title,
  kicker,
  href,
  params,
  tinted,
  limit = 4,
}: {
  title: string;
  kicker?: string;
  href: string;
  params: ProductListParams;
  tinted?: boolean;
  limit?: number;
}) {
  const { data, loading, failed, reload } = useAsyncData(JSON.stringify(params), (signal) =>
    listProducts({ ...params, pageSize: limit }, signal),
  );
  // Không có sản phẩm (ví dụ chưa có khuyến mại) thì ẩn cả khối.
  if (data && data.items.length === 0) return null;
  return (
    <Section tinted={tinted}>
      <SectionHeading title={title} kicker={kicker} href={href} />
      {failed ? (
        <BlockError title={title} onRetry={reload} />
      ) : loading || !data ? (
        <div role="status" aria-label={`Đang tải ${title}`} className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: limit }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {data.items.map((p) => (
            <li key={p.id} className="flex">
              <div className="flex w-full flex-col">
                <ProductCard product={p} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

const ART_METAL: MetalSlug[] = ["vang-hong", "vang-trang", "vang", "bach-kim"];

/** Ảnh đại diện danh mục: ảnh sản phẩm nổi bật đầu tiên của danh mục; chưa có thì dùng ảnh minh họa. */
function CategoryCover({ slug, name, index }: { slug: string; name: string; index: number }) {
  const { data } = useAsyncData(`cover-${slug}`, (signal) => listProducts({ category: slug, featured: true, pageSize: 1 }, signal));
  const art = artFor(slug);
  const metal = ART_METAL[index % ART_METAL.length];
  return (
    <ProductImage
      url={data?.items[0]?.primaryImageUrl}
      alt={`Danh mục ${name}`}
      art={art}
      metal={metal}
      variant={index}
      sizes="(min-width: 1024px) 15rem, (min-width: 640px) 33vw, 50vw"
    />
  );
}

export function CategoriesBlock() {
  const { data, loading, failed, reload } = useAsyncData("home-categories", () => getCategories());
  if (data && data.length === 0) return null;
  return (
    <Section>
      <SectionHeading title="Danh mục nổi bật" kicker="Mua sắm theo loại" />
      {failed ? (
        <BlockError title="Danh mục nổi bật" onRetry={reload} />
      ) : loading || !data ? (
        <div role="status" aria-label="Đang tải danh mục" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {data.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/products?category=${c.slug}`}
                className="group block overflow-hidden rounded-2xl border border-line bg-paper shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-pop"
              >
                <div className="aspect-square overflow-hidden">
                  <div className="relative h-full transition-transform duration-500 group-hover:scale-105">
                    <CategoryCover slug={c.slug} name={c.name} index={i} />
                  </div>
                </div>
                <div className="border-t border-line p-3 text-center">
                  <h3 className="font-serif text-lg text-ink group-hover:text-gold-deep sm:text-xl">{c.name}</h3>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

const COLLECTION_ART: { art: ArtSpec; metal: MetalSlug }[] = [
  { art: { kind: "ring", gem: "kim-cuong" }, metal: "vang-trang" },
  { art: { kind: "earring", gem: "ruby" }, metal: "vang-hong" },
  { art: { kind: "bracelet", gem: "sapphire" }, metal: "bach-kim" },
  { art: { kind: "necklace", gem: "ngoc-trai" }, metal: "vang" },
];

function CollectionBanner({ url, name, index }: { url: string | null; name: string; index: number }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return <ProductArt {...COLLECTION_ART[index % COLLECTION_ART.length]} variant={index + 1} label={`Bộ sưu tập ${name}`} />;
  }
  return (
    <Image
      src={url}
      alt={`Bộ sưu tập ${name}`}
      fill
      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      loading="lazy"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function CollectionsBlock() {
  const { data, loading, failed, reload } = useAsyncData("home-collections", () => getCollections());
  if (data && data.length === 0) return null;
  return (
    <Section id="bo-suu-tap">
      <SectionHeading title="Bộ sưu tập" kicker="Cảm hứng thiết kế" href="/products" />
      {failed ? (
        <BlockError title="Bộ sưu tập" onRetry={reload} />
      ) : loading || !data ? (
        <div role="status" aria-label="Đang tải bộ sưu tập" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/products?collection=${c.slug}`}
                className="group relative block overflow-hidden rounded-lg border border-line shadow-card"
              >
                <div className="relative aspect-[4/5]">
                  <CollectionBanner url={c.bannerUrl} name={c.name} index={i} />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-12 text-white">
                  <h3 className="font-serif text-2xl">{c.name}</h3>
                  {c.description && <p className="line-clamp-2 text-xs opacity-90">{c.description}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
