import { http } from "@/services/http";
import type { Paginated } from "@/types/catalog";
import type { ArticleDetail, ArticleItem, Banner, BannerPosition, Faq, MenuItem, PageDetail, SiteInfo } from "@/types/cms";
import { ApiError } from "@/utils/errors";

const get = <T>(url: string, params?: Record<string, unknown>, signal?: AbortSignal) =>
  http.get<T>(url, { params, signal }).then((r) => r.data);

/** 404 -> null (để trang gọi notFound()). */
async function getOrNull<T>(url: string): Promise<T | null> {
  try {
    return await get<T>(url);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export const cmsService = {
  siteInfo: () => get<Partial<SiteInfo>>("/site-info"),
  banners: (position: BannerPosition, signal?: AbortSignal) => get<Banner[]>("/banners", { position }, signal),
  menus: (placement: "header" | "footer") => get<MenuItem[]>("/menus", { placement }),
  articles: (params: { page?: number; pageSize?: number; q?: string }, signal?: AbortSignal) =>
    get<Paginated<ArticleItem>>("/articles", params, signal),
  article: (slug: string) => getOrNull<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`),
  page: (slug: string) => getOrNull<PageDetail>(`/pages/${encodeURIComponent(slug)}`),
  faqs: (signal?: AbortSignal) => get<Faq[]>("/faqs", undefined, signal),
};
