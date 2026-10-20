import { randomInt } from 'node:crypto';

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Ngày yyyyMMdd theo giờ Việt Nam (UTC+7) bất kể múi giờ máy chủ. */
export function formatVietnamDate(date: Date): string {
  const shifted = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${shifted.getUTCFullYear()}${pad(shifted.getUTCMonth() + 1)}${pad(shifted.getUTCDate())}`;
}

/** LG + yyyyMMdd (giờ VN) + '-' + 6 chữ số ngẫu nhiên an toàn mật mã. */
export function generateOrderCode(now = new Date()): string {
  return `LG${formatVietnamDate(now)}-${String(randomInt(0, 1_000_000)).padStart(6, '0')}`;
}

/** Đầu ngày (00:00 giờ VN) của chuỗi yyyy-MM-dd, ra thời điểm tuyệt đối. */
export function startOfVietnamDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+07:00`);
}
