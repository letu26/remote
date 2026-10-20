/** Dịch vụ danh mục/sản phẩm: gọi API công khai (API_CONTRACT_PHASE2.md). */
import { http } from "@/services/http";
import type {
  CategoryNode,
  CollectionItem,
  FilterOptions,
  OptionItem,
  Paginated,
  ProductDetail,
  ProductListParams,
  ProductSummary,
} from "@/types/catalog";
import { ApiError } from "@/utils/errors";

/** Danh sách bộ lọc hiếm đổi: nhớ kết quả ở trình duyệt để header và trang lọc không gọi lặp. */
const memo = new Map<string, Promise<unknown>>();
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (typeof window === "undefined") return load(); // phía server: không giữ cache giữa các request
  let hit = memo.get(key) as Promise<T> | undefined;
  if (!hit) {
    hit = load().catch((err) => {
      memo.delete(key);
      throw err;
    });
    memo.set(key, hit);
  }
  return hit;
}

export const clearCatalogCache = () => memo.clear();

const getList = <T>(url: string) => http.get<T>(url).then((r) => r.data);

export const getCategories = () =>
  cached("categories", () => getList<CategoryNode[]>("/categories"));
export const getMaterials = () =>
  cached("materials", () => getList<OptionItem[]>("/materials"));
export const getGemstones = () =>
  cached("gemstones", () => getList<OptionItem[]>("/gemstones"));
export const getCollections = () =>
  cached("collections", () => getList<CollectionItem[]>("/collections"));

/** Tùy chọn cho bộ lọc. Một danh sách lỗi thì nhóm đó rỗng, không làm hỏng cả bộ lọc. */
export async function getFilterOptions(): Promise<FilterOptions> {
  const [categories, materials, gemstones, collections] = await Promise.allSettled([
    getCategories(),
    getMaterials(),
    getGemstones(),
    getCollections(),
  ]);
  const ok = <T>(r: PromiseSettledResult<T[]>): T[] => (r.status === "fulfilled" ? r.value : []);
  return {
    categories: ok(categories),
    materials: ok(materials),
    gemstones: ok(gemstones),
    collections: ok(collections),
  };
}

export function listProducts(params: ProductListParams = {}, signal?: AbortSignal) {
  return http.get<Paginated<ProductSummary>>("/products", { params, signal }).then((r) => r.data);
}

/** Chi tiết sản phẩm; trả null nếu không tồn tại (404). */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await http.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
    return res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Gợi ý khi gõ tìm kiếm ở header. */
export async function suggestProducts(text: string, signal?: AbortSignal, limit = 5) {
  const res = await listProducts({ q: text, pageSize: limit }, signal);
  return res.items;
}

/** Duyệt cây danh mục để tìm theo slug. */
export function findCategory(nodes: CategoryNode[], slug: string): CategoryNode | undefined {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    const child = findCategory(n.children ?? [], slug);
    if (child) return child;
  }
  return undefined;
}
