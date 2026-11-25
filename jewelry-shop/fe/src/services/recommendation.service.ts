import { http } from "@/services/http";
import type { ProductSummary } from "@/types/catalog";
import type { ViewedProduct } from "@/utils/view-history";

export const recommendationService = {
  list: (viewed: ViewedProduct[], excludeProductId?: number, signal?: AbortSignal) =>
    http
      .post<{ personalized: boolean; items: ProductSummary[] }>("/recommendations", { viewed, excludeProductId }, { signal })
      .then((r) => r.data),
};
