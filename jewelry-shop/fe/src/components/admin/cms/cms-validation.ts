/** Liên kết: `/...` (không `//`) hoặc http(s)://, không có khoảng trắng/ký tự điều khiển. */
export function validateLink(value: string, required = false): string | undefined {
  const v = value.trim();
  if (!v) return required ? "Vui lòng nhập đường dẫn" : undefined;
  if (/[\s\u0000-\u001f\u007f]/.test(v)) return "Đường dẫn không được chứa khoảng trắng hoặc ký tự điều khiển";
  if (v.length > 500) return "Đường dẫn tối đa 500 ký tự";
  if (v.startsWith("/") && !v.startsWith("//")) return undefined;
  if (/^https?:\/\/[^/]+/i.test(v)) return undefined;
  return "Đường dẫn phải bắt đầu bằng / (nội bộ) hoặc http:// hoặc https://";
}

export function validateHttpsUrl(value: string, max = 255): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  if (v.length > max) return `Tối đa ${max} ký tự`;
  if (!/^https:\/\/[^\s/]+\S*$/i.test(v)) return "Phải là đường dẫn bắt đầu bằng https://";
}

export const PAGE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validatePageSlug(slug: string): string | undefined {
  const s = slug.trim();
  if (s.length < 2 || s.length > 120) return "Slug từ 2 đến 120 ký tự";
  if (!PAGE_SLUG_REGEX.test(s)) return "Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang";
}

export const MAX_KEYWORDS = 20;
export function parseKeywords(text: string): string[] {
  return text
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}
export function validateKeywords(text: string): string | undefined {
  const list = parseKeywords(text);
  if (list.length > MAX_KEYWORDS) return `Tối đa ${MAX_KEYWORDS} từ khóa`;
  const bad = list.find((k) => k.length < 2 || k.length > 50);
  if (bad !== undefined) return `Mỗi từ khóa từ 2 đến 50 ký tự (chưa đúng: "${bad}")`;
  if (list.join(",").length > 1000) return "Tổng độ dài từ khóa tối đa 1000 ký tự";
}

export const MAX_CONTENT = 100000;
export function validateContent(content: string): string | undefined {
  if (!content.trim()) return "Vui lòng nhập nội dung";
  if (content.length > MAX_CONTENT) return `Nội dung tối đa ${MAX_CONTENT} ký tự`;
}

export function validateEmailOrEmpty(v: string): string | undefined {
  const s = v.trim();
  if (!s) return undefined;
  if (s.length > 150) return "Email tối đa 150 ký tự";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "Email không đúng định dạng";
}
