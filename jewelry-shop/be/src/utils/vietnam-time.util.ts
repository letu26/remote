import type { ErrorDetail } from '../exceptions/error-codes.js';

/** Tiện ích ngày giờ theo múi giờ Việt Nam (UTC+7). Mọi mốc thời gian là UTC tuyệt đối; không phụ thuộc TZ máy chủ. */

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const MAX_RANGE_DAYS = 366;
export const DEFAULT_RANGE_DAYS = 30;
export const MAX_PERIODS = { day: 366, month: 60, year: 20 } as const;

export type Granularity = keyof typeof MAX_PERIODS;

/** yyyy-MM-dd theo giờ Việt Nam của một thời điểm. */
export function vietnamIsoDate(date: Date): string {
  return new Date(date.getTime() + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
}

/** Chuỗi yyyy-MM-dd có phải ngày lịch hợp lệ (bắt cả 2026-02-30). */
export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function addDaysIso(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Số ngày từ a đến b (a <= b => >= 0). */
export function diffDaysIso(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);
}

/** 00:00 giờ Việt Nam của ngày yyyy-MM-dd, ra thời điểm UTC (ngày d 00:00 VN = d-1 17:00 UTC). */
export function vietnamDayStartUtc(isoDate: string): Date {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) - VIETNAM_OFFSET_MS);
}

export function firstDayOfMonthIso(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export function firstDayOfNextMonthIso(isoDate: string): string {
  const [year, month] = [Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7))];
  return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

export interface StatsRange {
  from: string;
  to: string;
  /** Cận dưới (bao gồm) và cận trên (loại trừ) theo UTC. */
  startUtc: Date;
  endUtcExclusive: Date;
}

export type RangeResult = { ok: true; range: StatsRange } | { ok: false; errors: ErrorDetail[] };

/**
 * Chuẩn hóa khoảng ngày thống kê: mặc định to = hôm nay (VN), from = to - 29 ngày.
 * Lỗi: sai định dạng/ngày không tồn tại, from > to, quá 366 ngày.
 */
export function resolveStatsRange(from: string | undefined, to: string | undefined, now: Date): RangeResult {
  const errors: ErrorDetail[] = [];
  if (to !== undefined && !isValidIsoDate(to)) errors.push({ field: 'to', message: 'Ngày phải theo dạng yyyy-MM-dd hợp lệ' });
  if (from !== undefined && !isValidIsoDate(from)) errors.push({ field: 'from', message: 'Ngày phải theo dạng yyyy-MM-dd hợp lệ' });
  if (errors.length) return { ok: false, errors };

  const resolvedTo = to ?? vietnamIsoDate(now);
  const resolvedFrom = from ?? addDaysIso(resolvedTo, -(DEFAULT_RANGE_DAYS - 1));
  if (resolvedFrom > resolvedTo) {
    return { ok: false, errors: [{ field: 'from', message: 'from không được sau to' }] };
  }
  if (diffDaysIso(resolvedFrom, resolvedTo) + 1 > MAX_RANGE_DAYS) {
    return { ok: false, errors: [{ field: 'to', message: `Khoảng ngày tối đa ${MAX_RANGE_DAYS} ngày` }] };
  }
  return {
    ok: true,
    range: {
      from: resolvedFrom,
      to: resolvedTo,
      startUtc: vietnamDayStartUtc(resolvedFrom),
      endUtcExclusive: vietnamDayStartUtc(addDaysIso(resolvedTo, 1)),
    },
  };
}

/** Danh sách kỳ (yyyy-MM-dd | yyyy-MM | yyyy) tăng dần phủ kín khoảng from..to, để điền 0 cho kỳ trống. */
export function buildPeriods(granularity: Granularity, fromIso: string, toIso: string): string[] {
  if (granularity === 'day') {
    const periods: string[] = [];
    for (let day = fromIso; day <= toIso; day = addDaysIso(day, 1)) periods.push(day);
    return periods;
  }
  if (granularity === 'month') {
    const periods: string[] = [];
    for (let month = fromIso.slice(0, 7); month <= toIso.slice(0, 7); ) {
      periods.push(month);
      const [year, m] = [Number(month.slice(0, 4)), Number(month.slice(5, 7))];
      month = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`;
    }
    return periods;
  }
  const periods: string[] = [];
  for (let year = Number(fromIso.slice(0, 4)); year <= Number(toIso.slice(0, 4)); year += 1) periods.push(String(year));
  return periods;
}
