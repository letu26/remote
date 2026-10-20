import { http } from "./http";
import type { Paged } from "@/types/admin-catalog";
import type {
  AdminCustomer,
  AdminCustomerDetail,
  CustomerQuery,
  CustomerRole,
  CustomerStatus,
} from "@/types/admin-customer";

const base = "/admin/customers";

export const adminCustomerService = {
  async list(query: CustomerQuery): Promise<Paged<AdminCustomer>> {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params[k] = v as string | number;
    return (await http.get<Paged<AdminCustomer>>(base, { params })).data;
  },
  async get(id: number): Promise<AdminCustomerDetail> {
    return (await http.get<AdminCustomerDetail>(`${base}/${id}`)).data;
  },
  async setStatus(id: number, status: CustomerStatus, reason?: string): Promise<AdminCustomer> {
    return (await http.patch<AdminCustomer>(`${base}/${id}/status`, { status, ...(reason ? { reason } : {}) })).data;
  },
  async setRole(id: number, role: CustomerRole): Promise<AdminCustomer> {
    return (await http.patch<AdminCustomer>(`${base}/${id}/role`, { role })).data;
  },
};
