"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterIcon } from "@/components/ui/Icons";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { SORT_OPTIONS } from "@/constants/catalog";
import { useAsyncData } from "@/hooks/useAsyncData";
import { findCategory, getFilterOptions, listProducts } from "@/services/product.service";
import type { FilterOptions, ProductQuery, SortKey } from "@/types/catalog";
import { countActiveFilters, parseProductQuery, serializeProductQuery, toApiParams } from "@/utils/product-query";
import { ProductCard } from "./ProductCard";
import { ProductFilters } from "./ProductFilters";

const PAGE_SIZE = 12;
const NO_OPTIONS: FilterOptions = { categories: [], materials: [], gemstones: [], collections: [] };

export function ProductListing() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = useMemo(() => parseProductQuery(params), [params]);
  const [filterOpen, setFilterOpen] = useState(false);

  // Đổi bộ lọc: request cũ bị hủy, kết quả cũ bị bỏ (xem useAsyncData).
  const products = useAsyncData(serializeProductQuery(query), (signal) =>
    listProducts(toApiParams(query, PAGE_SIZE), signal),
  );
  const optionsState = useAsyncData("filter-options", () => getFilterOptions());
  const options = optionsState.data ?? NO_OPTIONS;
  const { data, loading } = products;

  const update = useCallback(
    (patch: Partial<ProductQuery>) => {
      const next = { ...query, ...patch, page: patch.page };
      const qs = serializeProductQuery(next);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [query, pathname, router],
  );

  const clearFilters = () => update({
    category: undefined, collection: undefined, material: undefined, gemstone: undefined,
    targetGroup: undefined, price: undefined, sale: undefined, inStock: undefined,
  });

  const active = countActiveFilters(query);
  const title = query.q
    ? `Kết quả cho "${query.q}"`
    : query.sale && !query.category
      ? "Sản phẩm khuyến mại"
      : query.category
        ? (findCategory(options.categories, query.category)?.name ?? "Trang sức")
        : query.collection
          ? `Bộ sưu tập ${options.collections.find((c) => c.slug === query.collection)?.name ?? ""}`.trim()
          : "Tất cả trang sức";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Trang sức" }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {loading ? "Đang tải..." : data ? `${data.total} sản phẩm` : ""}
          </p>
        </div>
        <div className="flex w-full items-end gap-3 sm:w-auto">
          <Button variant="secondary" className="lg:hidden" onClick={() => setFilterOpen(true)} aria-haspopup="dialog">
            <FilterIcon width={16} height={16} />
            Bộ lọc{active > 0 ? ` (${active})` : ""}
          </Button>
          <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
            <Select
              label="Sắp xếp"
              name="sort"
              hideLabel
              value={query.sort ?? "newest"}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
              options={SORT_OPTIONS.map((s) => ({ value: s.value, label: `Sắp xếp: ${s.label}` }))}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label="Bộ lọc sản phẩm">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-line bg-paper p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl">Bộ lọc</h2>
              {active > 0 && (
                <button type="button" onClick={clearFilters} className="text-xs text-gold-deep hover:underline">
                  Xóa bộ lọc
                </button>
              )}
            </div>
            <ProductFilters value={query} onChange={update} idPrefix="d" options={options} />
          </div>
        </aside>

        <section aria-label="Danh sách sản phẩm">
          {loading ? (
            <div role="status" aria-label="Đang tải sản phẩm" className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.failed || !data ? (
            <ErrorState
              title="Không tải được sản phẩm"
              description="Vui lòng kiểm tra kết nối và thử lại."
              onRetry={products.reload}
            />
          ) : data.items.length === 0 ? (
            <EmptyState
              title="Không tìm thấy sản phẩm"
              description="Thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác."
              action={active > 0 || query.q ? (
                <Button
                  variant="secondary"
                  onClick={() => router.push(pathname)}
                >
                  Xóa tất cả bộ lọc
                </Button>
              ) : undefined}
            />
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {data.items.map((p) => (
                  <li key={p.id} className="flex">
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  onPageChange={(page) => update({ page })}
                />
              </div>
            </>
          )}
        </section>
      </div>

      <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} title="Bộ lọc" side="right">
        <div className="p-5">
          <ProductFilters value={query} onChange={update} idPrefix="m" options={options} />
        </div>
        <div className="sticky bottom-0 flex gap-3 border-t border-line bg-page p-4">
          <Button variant="ghost" className="flex-1" onClick={clearFilters} disabled={active === 0}>
            Xóa bộ lọc
          </Button>
          <Button className="flex-1" onClick={() => setFilterOpen(false)}>
            {data && !loading ? `Xem ${data.total} sản phẩm` : "Xem kết quả"}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
