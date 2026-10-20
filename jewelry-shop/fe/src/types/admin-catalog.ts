export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type TargetGroup = "men" | "women" | "unisex" | "kids";

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  childCount: number;
}
export interface CategoryInput {
  name: string;
  slug?: string;
  parentId?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminNamedItem {
  id: number;
  name: string;
  isActive: boolean;
  productCount: number;
}
export interface NamedInput {
  name: string;
  isActive?: boolean;
}

export interface AdminCollection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  productCount?: number;
}
export interface CollectionInput {
  name: string;
  slug?: string;
  description?: string;
  bannerUrl?: string;
  isActive?: boolean;
}

export interface AdminProductListItem {
  id: number;
  code: string;
  name: string;
  slug: string;
  price: number;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  isFeatured: boolean;
  totalStock: number;
  primaryImageUrl: string | null;
  createdAt: string;
}

export interface ProductListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryId?: number;
  isActive?: boolean;
}

export interface AdminProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}
export interface AdminProductVariant {
  id: number;
  sku: string;
  size: string;
  stock: number;
  isActive: boolean;
}
export interface AdminProductGemstone {
  id?: number;
  gemstoneId: number;
  quantity: number;
  carat: number | null;
  color: string | null;
  clarity: string | null;
  cut: string | null;
}
export interface AdminProduct {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number;
  materialId: number | null;
  collectionId: number | null;
  targetGroup: TargetGroup;
  weight: number | null;
  costPrice: number;
  price: number;
  warrantyInfo: string | null;
  certificate: string | null;
  isFeatured: boolean;
  isActive: boolean;
  images: AdminProductImage[];
  variants: AdminProductVariant[];
  gemstones: AdminProductGemstone[];
}

export interface ProductGemstoneInput {
  gemstoneId: number;
  quantity: number;
  carat?: number;
  color?: string;
  clarity?: string;
  cut?: string;
}
export interface ProductVariantInput {
  id?: number;
  sku: string;
  size: string;
  /** Chỉ gửi khi tạo mới; khi sửa tồn kho đổi qua endpoint /stock. */
  stock?: number;
  isActive: boolean;
}
export interface ProductInput {
  code: string;
  name: string;
  slug?: string;
  description?: string;
  categoryId: number;
  materialId: number | null;
  collectionId: number | null;
  targetGroup: TargetGroup;
  weight?: number;
  costPrice: number;
  price: number;
  warrantyInfo?: string;
  certificate?: string;
  isFeatured: boolean;
  isActive: boolean;
  gemstones: ProductGemstoneInput[];
  variants: ProductVariantInput[];
}

export type StockChange = { delta: number } | { set: number };
export interface StockResult {
  id: number;
  sku: string;
  size: string;
  stock: number;
}
