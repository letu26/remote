/** Kiểu dữ liệu đặt hàng (API_CONTRACT_PHASE4.md). */

export type OrderStatus = "pending" | "confirmed" | "preparing" | "shipping" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "bank_transfer";
export type PaymentStatus = "unpaid" | "paid";

export interface ShippingMethod {
  id: number;
  name: string;
  description: string | null;
  fee: number;
}

export type PreviewIssueCode = "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";

export interface PreviewItem {
  cartItemId: number;
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  productCode: string;
  size: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderPreview {
  items: PreviewItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  issues: { cartItemId: number; issue: PreviewIssueCode; available?: number }[];
}

export interface CreateOrderInput {
  itemIds: number[];
  addressId: number;
  shippingMethodId: number;
  paymentMethod: PaymentMethod;
  note?: string;
  expectedTotal: number;
}

export interface PaymentInstructions {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferContent: string;
  amount: number;
}

export interface OrderListItem {
  code: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
  items: { productName: string; size: string; imageUrl: string | null; quantity: number }[];
}

export interface OrderDetail {
  code: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  cancelReason: string | null;
  note: string | null;
  receiver: { name: string; phone: string; province: string; ward: string; addressDetail: string };
  shippingMethodName: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: {
    productName: string;
    productCode: string;
    productSlug?: string | null;
    size: string;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  history: { status: OrderStatus; note: string | null; createdAt: string }[];
  paymentInstructions: PaymentInstructions | null;
}

export interface StockShortage {
  variantId: number;
  productName: string;
  size: string;
  available: number;
  requested: number;
}
