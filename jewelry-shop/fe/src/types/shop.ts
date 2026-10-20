/** Kiểu dữ liệu giỏ hàng, yêu thích, địa chỉ (API_CONTRACT_PHASE3.md). */
import type { ProductSummary } from "./catalog";

export type CartIssue = "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";

export interface CartItem {
  id: number;
  variantId: number;
  productId: number;
  productCode: string;
  productName: string;
  productSlug: string;
  size: string;
  imageUrl: string | null;
  price: number;
  salePrice: number | null;
  discountPercent: number | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  available: boolean;
  issue: CartIssue | null;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  totalQuantity: number;
  hasIssues: boolean;
}

export interface CartSummary {
  itemCount: number;
  totalQuantity: number;
}

export interface WishlistProduct extends ProductSummary {
  addedAt: string;
}

export interface Province {
  id: number;
  code: string;
  name: string;
}
export type Ward = Province;

export interface Address {
  id: number;
  receiverName: string;
  receiverPhone: string;
  provinceId: number;
  provinceName: string;
  wardId: number;
  wardName: string;
  detail: string;
  isDefault: boolean;
}

export interface AddressInput {
  receiverName: string;
  receiverPhone: string;
  provinceId: number;
  wardId: number;
  detail: string;
  isDefault?: boolean;
}
