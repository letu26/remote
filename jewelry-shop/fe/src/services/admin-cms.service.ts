import { http } from "./http";
import { createCrudService } from "./admin-catalog.service";
import type {
  AdminArticle,
  AdminArticleListItem,
  AdminBanner,
  AdminFaq,
  AdminMenu,
  AdminPage,
  ArticleInput,
  ArticleQuery,
  BannerInput,
  ChatbotAnswer,
  FaqInput,
  MenuInput,
  PageInput,
  SiteInfo,
} from "@/types/admin-cms";
import type { Paged } from "@/types/admin-catalog";

export const adminBannerService = createCrudService<AdminBanner, BannerInput>("banners");
export const adminMenuService = createCrudService<AdminMenu, MenuInput>("menus");

export const adminFaqService = {
  ...createCrudService<AdminFaq, FaqInput>("faqs"),
  /** Thử chatbot: dùng endpoint công khai `POST /chatbot/ask`. */
  async ask(message: string): Promise<ChatbotAnswer> {
    return (await http.post<ChatbotAnswer>("/chatbot/ask", { message })).data;
  },
};

export const adminPageService = {
  ...createCrudService<AdminPage, PageInput>("pages"),
  async get(id: number): Promise<AdminPage> {
    return (await http.get<AdminPage>(`/admin/pages/${id}`)).data;
  },
};

export const adminArticleService = {
  async list(query: ArticleQuery): Promise<Paged<AdminArticleListItem>> {
    const params: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params[k] = v;
    return (await http.get<Paged<AdminArticleListItem>>("/admin/articles", { params })).data;
  },
  async get(id: number): Promise<AdminArticle> {
    return (await http.get<AdminArticle>(`/admin/articles/${id}`)).data;
  },
  async create(input: ArticleInput): Promise<AdminArticle> {
    return (await http.post<AdminArticle>("/admin/articles", input)).data;
  },
  async update(id: number, input: Partial<ArticleInput>): Promise<AdminArticle> {
    return (await http.patch<AdminArticle>(`/admin/articles/${id}`, input)).data;
  },
  async remove(id: number): Promise<void> {
    await http.delete(`/admin/articles/${id}`);
  },
};

export const adminSiteInfoService = {
  async get(): Promise<SiteInfo> {
    return (await http.get<SiteInfo>("/admin/settings/site-info")).data;
  },
  async save(input: SiteInfo): Promise<SiteInfo> {
    return (await http.put<SiteInfo>("/admin/settings/site-info", input)).data;
  },
  /** Công khai, dùng cho hóa đơn in. */
  async getPublic(): Promise<SiteInfo> {
    return (await http.get<SiteInfo>("/site-info")).data;
  },
};
