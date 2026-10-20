import { BRAND_NAME, BRAND_TAGLINE } from "@/constants";
import { CONTACT, FOOTER_LINKS, NAV_LEAD, NAV_TAIL } from "@/constants/site";
import type { MenuItem, SiteInfo } from "@/types/cms";

/** Thông tin dự phòng từ hằng số, dùng khi API lỗi hoặc thiếu trường. */
export const FALLBACK_SITE_INFO: SiteInfo = {
  brandName: BRAND_NAME,
  slogan: BRAND_TAGLINE,
  hotline: CONTACT.hotline,
  email: CONTACT.email,
  address: CONTACT.address,
  openingHours: CONTACT.hours,
  facebook: "",
  zalo: "",
  instagram: "",
  tiktok: "",
  footerText: "",
};

/** Liên kết an toàn: đường dẫn nội bộ (`/x`, không `//`) hoặc http(s). */
export function isSafeLink(url: unknown): url is string {
  if (typeof url !== "string" || url.length === 0) return false;
  if (/[\u0000-\u001f\u007f\s\\]/.test(url)) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  return /^https?:\/\//i.test(url);
}

export const isExternalLink = (url: string) => /^https?:\/\//i.test(url);

/** Trộn dữ liệu API với dự phòng: trường rỗng hoặc sai kiểu dùng giá trị dự phòng. */
export function mergeSiteInfo(api: Partial<SiteInfo> | null | undefined): SiteInfo {
  const out = { ...FALLBACK_SITE_INFO };
  if (!api || typeof api !== "object") return out;
  for (const key of Object.keys(out) as (keyof SiteInfo)[]) {
    const v = api[key];
    if (typeof v === "string" && v.trim() !== "") out[key] = v.trim();
  }
  // Mạng xã hội không có dự phòng: API trả rỗng thì để rỗng (không hiện).
  return out;
}

export interface SocialLink {
  key: "facebook" | "zalo" | "instagram" | "tiktok";
  label: string;
  url: string;
}

/** Chỉ các mạng xã hội có giá trị https hợp lệ. */
export function socialLinks(info: SiteInfo): SocialLink[] {
  const defs: Omit<SocialLink, "url">[] = [
    { key: "facebook", label: "Facebook" },
    { key: "zalo", label: "Zalo" },
    { key: "instagram", label: "Instagram" },
    { key: "tiktok", label: "TikTok" },
  ];
  return defs
    .map((d) => ({ ...d, url: info[d.key] }))
    .filter((s) => /^https:\/\//i.test(s.url) && isSafeLink(s.url));
}

export interface NavNode {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

/** Chuẩn hóa cây menu từ API: bỏ mục sai dạng hoặc liên kết không an toàn. */
export function normalizeMenu(items: MenuItem[] | null | undefined): NavNode[] {
  if (!Array.isArray(items)) return [];
  const out: NavNode[] = [];
  for (const it of items) {
    if (!it || typeof it.label !== "string" || !it.label.trim() || !isSafeLink(it.url)) continue;
    const children = (Array.isArray(it.children) ? it.children : [])
      .filter((c) => c && typeof c.label === "string" && c.label.trim() && isSafeLink(c.url))
      .map((c) => ({ label: c.label.trim(), href: c.url }));
    out.push({ label: it.label.trim(), href: it.url, ...(children.length ? { children } : {}) });
  }
  return out;
}

/** Menu đầu trang dự phòng khi API lỗi/rỗng: mục tĩnh (danh mục động do header bổ sung). */
export const FALLBACK_HEADER_LEAD: NavNode[] = NAV_LEAD.map((n) => ({ label: n.label, href: n.href }));
export const FALLBACK_HEADER_TAIL: NavNode[] = NAV_TAIL.map((n) => ({ label: n.label, href: n.href }));

export const FALLBACK_FOOTER_MENU: NavNode[] = [
  ...FOOTER_LINKS.shop.map((n) => ({ label: n.label, href: n.href })),
  ...FOOTER_LINKS.support.map((n) => ({ label: n.label, href: n.href })),
];

export const telHref = (hotline: string) => `tel:${hotline.replace(/[^\d+]/g, "")}`;
