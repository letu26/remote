/** Kiểu dữ liệu của API công khai danh mục/sản phẩm (API_CONTRACT_PHASE2.md). */

export type TargetGroup = "men" | "women" | "unisex" | "kids";
export type SortKey = "newest" | "price_asc" | "price_desc" | "bestseller" | "rating";

export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  children: CategoryNode[];
}

export interface OptionItem {
  id: number;
  name: string;
}

export interface CollectionItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
}

export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface ProductSummary {
  id: number;
  code: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  discountPercent: number | null;
  primaryImageUrl: string | null;
  inStock: boolean;
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  /** Số biến thể đang bán; có thể thiếu khi chạy với backend cũ. */
  variantCount?: number;
  /** Id biến thể duy nhất nếu variantCount === 1, ngược lại null. */
  singleVariantId?: number | null;
  targetGroup: TargetGroup;
  category: CategoryRef;
}

export interface ProductImageItem {
  id: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  sku: string;
  /** Chuỗi rỗng nếu sản phẩm không có size. */
  size: string;
  stock: number;
}

export interface ProductGemstoneItem {
  id: number;
  gemstoneId: number;
  name: string;
  quantity: number;
  carat: number | null;
  color: string | null;
  clarity: string | null;
  cut: string | null;
}

export interface ProductDetail extends Omit<ProductSummary, "primaryImageUrl"> {
  description: string | null;
  weight: number | null;
  warrantyInfo: string | null;
  certificate: string | null;
  soldCount: number;
  breadcrumb: CategoryRef[];
  material: OptionItem | null;
  collection: { id: number; name: string; slug: string } | null;
  images: ProductImageItem[];
  variants: ProductVariant[];
  gemstones: ProductGemstoneItem[];
  related: ProductSummary[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Bộ lọc nằm trên URL của trang /products. */
export interface ProductQuery {
  q?: string;
  /** Slug danh mục. */
  category?: string;
  /** Slug bộ sưu tập. */
  collection?: string;
  material?: number;
  gemstone?: number[];
  targetGroup?: TargetGroup;
  /** Khóa khoảng giá, xem PRICE_RANGES. */
  price?: string;
  sale?: boolean;
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
}

/** Tham số gửi cho GET /products. */
export interface ProductListParams {
  q?: string;
  category?: string;
  collection?: string;
  material?: number;
  gemstone?: string;
  targetGroup?: TargetGroup;
  minPrice?: number;
  maxPrice?: number;
  inStock?: true;
  onSale?: true;
  featured?: true;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

export interface FilterOptions {
  categories: CategoryNode[];
  materials: OptionItem[];
  gemstones: OptionItem[];
  collections: CollectionItem[];
}

/** Cách vẽ ảnh minh họa mặc định khi sản phẩm chưa có ảnh. */
export type MetalSlug = "vang" | "vang-trang" | "vang-hong" | "bac" | "bach-kim";
export type GemSlug = "kim-cuong" | "ruby" | "sapphire" | "ngoc-trai";

export interface ArtSpec {
  kind: "ring" | "necklace" | "earring" | "bracelet" | "gemstone";
  gem: GemSlug | "none";
}
