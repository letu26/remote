const VN_OFFSET_MS = 7 * 3600 * 1000;
const DAY_MS = 86400000;
export const MAX_RANGE_DAYS = 366;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Ngày yyyy-MM-dd theo giờ Việt Nam (UTC+7) của một thời điểm. */
export function vnDateString(date: Date): string {
  return new Date(date.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

function parseYmd(ymd: string): number | null {
  if (!YMD.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t);
  // Loại ngày không tồn tại (31/02...).
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== d) return null;
  return t;
}

export function addDays(ymd: string, days: number): string {
  const t = parseYmd(ymd);
  if (t === null) throw new Error(`Ngày không hợp lệ: ${ymd}`);
  return new Date(t + days * DAY_MS).toISOString().slice(0, 10);
}

/** Số ngày gồm cả hai đầu mút. */
export function daysInclusive(from: string, to: string): number {
  const a = parseYmd(from);
  const b = parseYmd(to);
  if (a === null || b === null) return NaN;
  return Math.round((b - a) / DAY_MS) + 1;
}

/** `days` ngày gần nhất tính đến `today` (gồm cả hôm nay). */
export function presetRange(days: number, today: string): { from: string; to: string } {
  return { from: addDays(today, -(days - 1)), to: today };
}

export function validateRange(from: string, to: string): string | undefined {
  if (parseYmd(from) === null || parseYmd(to) === null) return "Vui lòng chọn ngày hợp lệ";
  if (from > to) return "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc";
  if (daysInclusive(from, to) > MAX_RANGE_DAYS) return `Khoảng ngày tối đa ${MAX_RANGE_DAYS} ngày`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO (UTC) -> giá trị cho <input type="datetime-local"> theo giờ địa phương của trình duyệt. */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Giá trị datetime-local (giờ địa phương) -> chuỗi ISO có múi giờ (UTC, hậu tố Z); null nếu không hợp lệ. */
export function fromLocalInputValue(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO UTC -> "17/10/2026 10:00" theo giờ địa phương của trình duyệt. */
export function formatLocal(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}
