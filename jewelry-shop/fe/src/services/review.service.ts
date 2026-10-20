import { http } from "@/services/http";
import type { Paginated } from "@/types/catalog";
import type { MyReview, MyReviewListItem, MyReviewState, ReviewInput, ReviewPage } from "@/types/review";

const base = (slug: string) => `/products/${encodeURIComponent(slug)}`;

export const reviewService = {
  list: (slug: string, params: { page?: number; pageSize?: number; rating?: number }, signal?: AbortSignal) =>
    http.get<ReviewPage>(`${base(slug)}/reviews`, { params, signal }).then((r) => r.data),
  myReview: (slug: string, signal?: AbortSignal) =>
    http.get<MyReviewState>(`${base(slug)}/my-review`, { signal }).then((r) => r.data),
  create: (slug: string, input: ReviewInput) =>
    http.post<MyReview>(`${base(slug)}/reviews`, input).then((r) => r.data),
  update: (id: number, input: Partial<ReviewInput>) => http.patch<MyReview>(`/reviews/${id}`, input).then((r) => r.data),
  remove: (id: number) => http.delete(`/reviews/${id}`).then(() => undefined),
  mine: (params: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
    http.get<Paginated<MyReviewListItem>>("/reviews/me", { params, signal }).then((r) => r.data),
};
