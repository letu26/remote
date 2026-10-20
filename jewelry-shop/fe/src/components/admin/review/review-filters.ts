import type { AdminReviewQuery } from "@/types/admin-review";

export interface ReviewFilters {
  q: string;
  rating: "" | "1" | "2" | "3" | "4" | "5";
  hidden: "" | "true" | "false";
  productId: string;
  page: number;
}

export function parseReviewFilters(params: URLSearchParams): ReviewFilters {
  const rating = params.get("rating") ?? "";
  const hidden = params.get("hidden") ?? "";
  const pid = params.get("productId") ?? "";
  const page = Number(params.get("page"));
  return {
    q: params.get("q") ?? "",
    rating: ["1", "2", "3", "4", "5"].includes(rating) ? (rating as ReviewFilters["rating"]) : "",
    hidden: hidden === "true" || hidden === "false" ? hidden : "",
    productId: /^\d+$/.test(pid) && Number(pid) > 0 ? pid : "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export function buildReviewSearch(f: ReviewFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.rating) p.set("rating", f.rating);
  if (f.hidden) p.set("hidden", f.hidden);
  if (f.productId) p.set("productId", f.productId);
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function reviewFiltersToQuery(f: ReviewFilters, pageSize: number): AdminReviewQuery {
  return {
    page: f.page,
    pageSize,
    q: f.q.trim() || undefined,
    rating: f.rating ? Number(f.rating) : undefined,
    hidden: f.hidden ? f.hidden === "true" : undefined,
    productId: f.productId ? Number(f.productId) : undefined,
  };
}
