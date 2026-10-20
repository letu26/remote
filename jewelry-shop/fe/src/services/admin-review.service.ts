import { http } from "./http";
import type { Paged } from "@/types/admin-catalog";
import type { AdminReview, AdminReviewQuery } from "@/types/admin-review";

export const adminReviewService = {
  async list(query: AdminReviewQuery): Promise<Paged<AdminReview>> {
    const params: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params[k] = v;
    return (await http.get<Paged<AdminReview>>("/admin/reviews", { params })).data;
  },
  async setHidden(id: number, isHidden: boolean): Promise<AdminReview> {
    return (await http.patch<AdminReview>(`/admin/reviews/${id}/visibility`, { isHidden })).data;
  },
};
