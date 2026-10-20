export type BannerPosition = "home_hero" | "home_promo";
export interface AdminBanner {
  id: number;
  title: string;
  imageUrl: string;
  imagePublicId: string | null;
  linkUrl: string | null;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}
export interface BannerInput {
  title: string;
  imageUrl: string;
  imagePublicId?: string;
  linkUrl?: string;
  position: BannerPosition;
  sortOrder?: number;
  isActive?: boolean;
}

export type MenuPlacement = "header" | "footer";
export interface AdminMenu {
  id: number;
  label: string;
  url: string;
  parentId: number | null;
  placement: MenuPlacement;
  sortOrder: number;
  isActive: boolean;
}
export interface MenuInput {
  label: string;
  url: string;
  parentId?: number | null;
  placement?: MenuPlacement;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminArticleListItem {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface AdminArticle extends AdminArticleListItem {
  content: string;
  thumbnailPublicId: string | null;
}
export interface ArticleInput {
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  isPublished?: boolean;
}
export interface ArticleQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  published?: boolean;
}

export interface AdminPage {
  id: number;
  slug: string;
  title: string;
  content?: string;
  isActive: boolean;
  isReserved: boolean;
}
export interface PageInput {
  slug?: string;
  title?: string;
  content?: string;
  isActive?: boolean;
}

export interface AdminFaq {
  id: number;
  question: string;
  answer: string;
  keywords: string | null;
  sortOrder: number;
  isActive: boolean;
}
export interface FaqInput {
  question: string;
  answer: string;
  keywords?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ChatbotAnswer {
  answer: string;
  matched: { id: number; question: string } | null;
  suggestions: { id: number; question: string }[];
  fallback: boolean;
}

export interface SiteInfo {
  brandName: string;
  slogan: string;
  hotline: string;
  email: string;
  address: string;
  openingHours: string;
  facebook: string;
  zalo: string;
  instagram: string;
  tiktok: string;
  footerText: string;
}

export interface UploadedImage {
  url: string;
  publicId: string;
}
