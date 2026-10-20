/** Kiểu dữ liệu nội dung CMS và chatbot (API_CONTRACT_PHASE6.md). */

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

export type BannerPosition = "home_hero" | "home_promo";

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: BannerPosition;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  label: string;
  url: string;
  children: { id: number; label: string; url: string }[];
}

export interface ArticleItem {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
}

export interface ArticleDetail extends ArticleItem {
  content: string;
  updatedAt: string;
  related: ArticleItem[];
}

export interface PageDetail {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
}

export interface ChatSuggestion {
  id: number;
  question: string;
}

export interface ChatSuggestions {
  greeting: string;
  suggestions: ChatSuggestion[];
}

export interface ChatAnswer {
  answer: string;
  matched: ChatSuggestion | null;
  suggestions: ChatSuggestion[];
  fallback: boolean;
}
