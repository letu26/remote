import { http } from "./http";
import type {
  DateRange,
  Granularity,
  LowStockItem,
  OrdersByStatus,
  RevenuePoint,
  StatsOverview,
  TopCustomer,
  TopProduct,
} from "@/types/admin-stats";

const get = async <T>(path: string, params: object, signal?: AbortSignal): Promise<T> =>
  (await http.get<T>(`/admin/stats/${path}`, { params, signal })).data;

export const adminStatsService = {
  overview: (r: DateRange, signal?: AbortSignal) => get<StatsOverview>("overview", r, signal),
  revenue: (r: DateRange, granularity: Granularity, signal?: AbortSignal) => get<RevenuePoint[]>("revenue", { ...r, granularity }, signal),
  ordersByStatus: (r: DateRange, signal?: AbortSignal) => get<OrdersByStatus>("orders-by-status", r, signal),
  topProducts: (r: DateRange, limit = 10, signal?: AbortSignal) => get<TopProduct[]>("top-products", { ...r, limit }, signal),
  lowStock: (threshold = 5, limit = 20, signal?: AbortSignal) => get<LowStockItem[]>("low-stock", { threshold, limit }, signal),
  // AI trả lời lâu hơn các API thường nên đặt thời gian chờ dài hơn.
  analysis: async (r: DateRange) =>
    (await http.post<{ analysis: string | null; message: string | null }>("/admin/stats/analysis", {}, { params: r, timeout: 40000 })).data,
  topCustomers: (r: DateRange, limit = 10, signal?: AbortSignal) => get<TopCustomer[]>("top-customers", { ...r, limit }, signal),
};
