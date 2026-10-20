import type { OrderStatus } from "./admin-order";

export interface DateRange {
  from: string;
  to: string;
}

export interface StatsOverview {
  range: DateRange;
  pendingOrders: number;
  today: { orders: number; revenue: number };
  thisMonth: { orders: number; revenue: number };
  inRange: { orders: number; revenue: number; averageOrderValue: number };
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
}

export type Granularity = "day" | "month" | "year";
export interface RevenuePoint {
  period: string;
  orders: number;
  revenue: number;
}

export type OrdersByStatus = Record<OrderStatus, number>;

export interface TopProduct {
  productCode: string;
  productName: string;
  quantity: number;
  revenue: number;
  productId?: number | null;
  productSlug?: string | null;
}
export interface LowStockItem {
  productId: number;
  productCode: string;
  productName: string;
  variantId: number;
  sku: string;
  size: string;
  stock: number;
}
export interface TopCustomer {
  userId: number;
  fullName: string;
  phone: string;
  orders: number;
  totalSpent: number;
}
