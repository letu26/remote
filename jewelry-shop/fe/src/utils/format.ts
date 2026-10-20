const vnd = new Intl.NumberFormat("vi-VN");

/** 12500000 -> "12.500.000 ₫" */
export function formatVND(amount: number): string {
  return `${vnd.format(Math.round(amount))} ₫`;
}

/** Giá sau khuyến mại theo % giảm. */
export function applyDiscount(price: number, percent?: number | null): number {
  if (!percent || percent <= 0) return price;
  return Math.round((price * (100 - percent)) / 100 / 1000) * 1000;
}

/** "2026-03-01" -> "01/03/2026" (không phụ thuộc múi giờ). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** ISO -> "17/10/2026 14:30" theo giờ Việt Nam. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

/** ISO -> "17/10/2026 14:30" theo múi giờ của trình duyệt. */
export function formatLocalDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
