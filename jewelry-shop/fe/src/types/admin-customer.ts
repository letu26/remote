import type { OrderStatus, PaymentStatus } from "./admin-order";

export type CustomerStatus = "active" | "locked";
export type CustomerRole = "user" | "admin";

export interface AdminCustomer {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: CustomerRole;
  status: CustomerStatus;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface AdminCustomerDetail extends AdminCustomer {
  addressCount: number;
  reviewCount: number;
  wishlistCount: number;
  recentOrders: {
    id?: number;
    code: string;
    createdAt: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    total: number;
    itemCount: number;
  }[];
}

export interface CustomerQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: CustomerStatus;
  role?: CustomerRole;
}
