import { http } from "./http";
import type { Paged } from "@/types/admin-catalog";
import type { AdminPromotion, PromotionCreateInput, PromotionQuery, PromotionUpdateInput } from "@/types/admin-promotion";

const base = "/admin/promotions";

export const adminPromotionService = {
  async list(query: PromotionQuery): Promise<Paged<AdminPromotion>> {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params[k] = v as string | number;
    return (await http.get<Paged<AdminPromotion>>(base, { params })).data;
  },
  async create(input: PromotionCreateInput): Promise<{ created: number; items: AdminPromotion[] }> {
    return (await http.post<{ created: number; items: AdminPromotion[] }>(base, input)).data;
  },
  async update(id: number, input: PromotionUpdateInput): Promise<AdminPromotion> {
    return (await http.patch<AdminPromotion>(`${base}/${id}`, input)).data;
  },
  async remove(id: number): Promise<void> {
    await http.delete(`${base}/${id}`);
  },
};
