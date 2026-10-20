import type { TargetGroup } from './product.entity.js';

export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  children: CategoryNode[];
}

export interface NamedItem {
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

/** Điều kiện lọc danh sách sản phẩm công khai; service đã đổi slug sang id. */
export interface ProductListFilter {
  categoryIds: number[];
  collectionId?: number;
  materialId?: number;
  gemstoneIds?: number[];
  targetGroups?: TargetGroup[];
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  excludeProductId?: number;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'bestseller' | 'rating';

export interface ProductListRow {
  id: number;
  code: string;
  name: string;
  slug: string;
  price: number;
  discountPercent: number | null;
  categoryId: number;
  primaryImageUrl: string | null;
  inStock: boolean;
  /** Số biến thể đang bán; singleVariantId là id biến thể đó khi chỉ có đúng một (để thêm giỏ thẳng), ngược lại null. */
  variantCount: number;
  singleVariantId: number | null;
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  targetGroup: TargetGroup;
}

export interface ProductDetailRow {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountPercent: number | null;
  targetGroup: TargetGroup;
  weight: number | null;
  warrantyInfo: string | null;
  certificate: string | null;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  categoryId: number;
  materialId: number | null;
  collectionId: number | null;
}

export interface ImageRow {
  id: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface VariantRow {
  id: number;
  sku: string;
  size: string;
  stock: number;
  isActive: boolean;
}

export interface GemstoneRow {
  id: number;
  gemstoneId: number;
  name: string;
  quantity: number;
  carat: number | null;
  color: string | null;
  clarity: string | null;
  cut: string | null;
}
