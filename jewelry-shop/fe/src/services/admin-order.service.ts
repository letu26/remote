import { http } from "./http";
import type {
  AdminOrderDetail,
  AdminOrderListItem,
  AdminOrderQuery,
  OrderStatus,
  PaymentStatus,
} from "@/types/admin-order";
import type { Paged } from "@/types/admin-catalog";

const base = "/admin/orders";

export const adminOrderService = {
  async list(query: AdminOrderQuery): Promise<Paged<AdminOrderListItem>> {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params[k] = v;
    return (await http.get<Paged<AdminOrderListItem>>(base, { params })).data;
  },
  async get(id: number): Promise<AdminOrderDetail> {
    return (await http.get<AdminOrderDetail>(`${base}/${id}`)).data;
  },
  async changeStatus(id: number, status: OrderStatus, note?: string): Promise<AdminOrderDetail> {
    return (await http.patch<AdminOrderDetail>(`${base}/${id}/status`, { status, ...(note ? { note } : {}) })).data;
  },
  async changePayment(id: number, paymentStatus: PaymentStatus, note?: string): Promise<AdminOrderDetail> {
    return (await http.patch<AdminOrderDetail>(`${base}/${id}/payment`, { paymentStatus, ...(note ? { note } : {}) })).data;
  },
};
