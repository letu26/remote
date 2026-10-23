export type OrderStatus = "pending" | "confirmed" | "preparing" | "shipping" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "paid";
export type PaymentMethod = "cod" | "bank_transfer" | "zalopay";

export interface AdminOrderListItem {
  id: number;
  code: string;
  createdAt: string;
  receiverName: string;
  receiverPhone: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
}

export interface AdminOrderQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  from?: string;
  to?: string;
  userId?: number;
}

export interface AdminOrderItem {
  productName: string;
  productCode: string;
  productSlug?: string;
  size: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AdminOrderHistory {
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  changedByName: string | null;
}

export interface AdminOrderDetail {
  id: number;
  code: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  cancelReason: string | null;
  note: string | null;
  customer: { id: number; fullName: string; phone: string; email: string | null };
  receiver: { name: string; phone: string; province: string; ward: string; addressDetail: string };
  shippingMethodName: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: AdminOrderItem[];
  history: AdminOrderHistory[];
}

export interface AdminShippingMethod {
  id: number;
  name: string;
  description: string | null;
  fee: number;
  isActive: boolean;
}
export interface ShippingMethodInput {
  name: string;
  description?: string;
  fee: number;
  isActive?: boolean;
}

export interface BankTransferSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferNote: string;
}
