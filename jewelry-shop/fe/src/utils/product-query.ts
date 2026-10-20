import { PRICE_RANGES, SORT_OPTIONS, TARGET_GROUPS } from "@/constants/catalog";
import type { ProductListParams, ProductQuery } from "@/types/catalog";

type Params = Pick<URLSearchParams, "get">;

const positiveInt = (raw: string | null): number | undefined => {
  const n = Number(raw);
  return raw && Number.isInteger(n) && n > 0 ? n : undefined;
};

/** Đọc bộ lọc từ URL, bỏ qua giá trị không hợp lệ. */
export function parseProductQuery(params: Params): ProductQuery {
  const gemstone = (params.get("gemstone") ?? "")
    .split(",")
    .map((v) => positiveInt(v))
    .filter((v): v is number => v !== undefined);
  const page = positiveInt(params.get("page"));
  return {
    q: params.get("q")?.trim() || undefined,
    category: params.get("category") || undefined,
    collection: params.get("collection") || undefined,
    material: positiveInt(params.get("material")),
    gemstone: gemstone.length ? gemstone : undefined,
    targetGroup: TARGET_GROUPS.find((t) => t.value === params.get("targetGroup"))?.value,
    price: PRICE_RANGES.find((r) => r.key === params.get("price"))?.key,
    sale: params.get("sale") === "1" || undefined,
    inStock: params.get("instock") === "1" || undefined,
    sort: SORT_OPTIONS.find((s) => s.value === params.get("sort"))?.value,
    page: page && page > 1 ? page : undefined,
  };
}

/** Ghi bộ lọc ra chuỗi query của URL (bỏ trường rỗng). */
export function serializeProductQuery(q: ProductQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.category) p.set("category", q.category);
  if (q.collection) p.set("collection", q.collection);
  if (q.material) p.set("material", String(q.material));
  if (q.gemstone?.length) p.set("gemstone", q.gemstone.join(","));
  if (q.targetGroup) p.set("targetGroup", q.targetGroup);
  if (q.price) p.set("price", q.price);
  if (q.sale) p.set("sale", "1");
  if (q.inStock) p.set("instock", "1");
  if (q.sort && q.sort !== "newest") p.set("sort", q.sort);
  if (q.page && q.page > 1) p.set("page", String(q.page));
  return p.toString();
}

/** Chuyển bộ lọc trên URL sang query của GET /products. */
export function toApiParams(q: ProductQuery, pageSize = 12): ProductListParams {
  const range = PRICE_RANGES.find((r) => r.key === q.price);
  return {
    q: q.q,
    category: q.category,
    collection: q.collection,
    material: q.material,
    gemstone: q.gemstone?.length ? q.gemstone.join(",") : undefined,
    targetGroup: q.targetGroup,
    minPrice: range?.min,
    maxPrice: range?.max,
    inStock: q.inStock ? true : undefined,
    onSale: q.sale ? true : undefined,
    sort: q.sort,
    page: q.page,
    pageSize,
  };
}

export function countActiveFilters(q: ProductQuery): number {
  return (
    (q.category ? 1 : 0) + (q.collection ? 1 : 0) + (q.material ? 1 : 0) + (q.gemstone?.length ?? 0) +
    (q.targetGroup ? 1 : 0) + (q.price ? 1 : 0) + (q.sale ? 1 : 0) + (q.inStock ? 1 : 0)
  );
}
