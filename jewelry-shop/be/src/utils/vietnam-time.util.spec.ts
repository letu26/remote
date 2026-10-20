import { describe, expect, it } from 'vitest';
import {
  addDaysIso,
  buildPeriods,
  diffDaysIso,
  firstDayOfNextMonthIso,
  isValidIsoDate,
  resolveStatsRange,
  vietnamDayStartUtc,
  vietnamIsoDate,
} from './vietnam-time.util.js';

describe('vietnamIsoDate', () => {
  it('cộng 7 giờ để ra ngày Việt Nam', () => {
    expect(vietnamIsoDate(new Date('2026-10-17T16:59:59Z'))).toBe('2026-10-17');
    expect(vietnamIsoDate(new Date('2026-10-17T17:00:00Z'))).toBe('2026-10-18');
    expect(vietnamIsoDate(new Date('2026-12-31T17:00:00Z'))).toBe('2027-01-01');
  });
});

describe('vietnamDayStartUtc', () => {
  it('ngày d 00:00 giờ VN = d-1 17:00 UTC', () => {
    expect(vietnamDayStartUtc('2026-10-18').toISOString()).toBe('2026-10-17T17:00:00.000Z');
    expect(vietnamDayStartUtc('2026-01-01').toISOString()).toBe('2025-12-31T17:00:00.000Z');
  });
});

describe('isValidIsoDate / addDaysIso / diffDaysIso', () => {
  it('bắt ngày không tồn tại và sai định dạng', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2028-02-29')).toBe(true);
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('2026-1-01')).toBe(false);
    expect(isValidIsoDate('abc')).toBe(false);
  });

  it('cộng/trừ ngày qua ranh giới tháng, năm', () => {
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
    expect(diffDaysIso('2026-01-01', '2026-12-31')).toBe(364);
    expect(firstDayOfNextMonthIso('2026-12-15')).toBe('2027-01-01');
    expect(firstDayOfNextMonthIso('2026-10-18')).toBe('2026-11-01');
  });
});

describe('resolveStatsRange', () => {
  const now = new Date('2026-10-18T05:00:00Z'); // 12:00 ngày 2026-10-18 giờ VN

  it('mặc định to = hôm nay (VN), from = to - 29 ngày', () => {
    const result = resolveStatsRange(undefined, undefined, now);
    expect(result.ok && result.range).toMatchObject({ from: '2026-09-19', to: '2026-10-18' });
  });

  it('cận UTC: from 00:00 VN đến hết ngày to', () => {
    const result = resolveStatsRange('2026-10-01', '2026-10-02', now);
    expect(result.ok && result.range.startUtc.toISOString()).toBe('2026-09-30T17:00:00.000Z');
    expect(result.ok && result.range.endUtcExclusive.toISOString()).toBe('2026-10-02T17:00:00.000Z');
  });

  it('lỗi: định dạng, ngày không tồn tại, from > to, quá 366 ngày', () => {
    expect(resolveStatsRange('2026/10/01', undefined, now)).toMatchObject({ ok: false, errors: [{ field: 'from' }] });
    expect(resolveStatsRange(undefined, '2026-02-30', now)).toMatchObject({ ok: false, errors: [{ field: 'to' }] });
    expect(resolveStatsRange('2026-10-05', '2026-10-01', now)).toMatchObject({ ok: false, errors: [{ field: 'from' }] });
    expect(resolveStatsRange('2025-01-01', '2026-01-02', now).ok).toBe(false);
  });

  it('đúng 366 ngày là hợp lệ, 367 ngày thì không', () => {
    expect(resolveStatsRange('2026-01-01', '2027-01-01', now).ok).toBe(true); // 366 ngày
    expect(resolveStatsRange('2026-01-01', '2027-01-02', now).ok).toBe(false);
  });

  it('from bỏ trống nhưng to xa: from = to - 29', () => {
    const result = resolveStatsRange(undefined, '2026-03-01', now);
    expect(result.ok && result.range.from).toBe('2026-01-31');
  });
});

describe('buildPeriods', () => {
  it('theo ngày', () => {
    expect(buildPeriods('day', '2026-02-27', '2026-03-02')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
  });

  it('theo tháng, qua ranh giới năm', () => {
    expect(buildPeriods('month', '2026-11-20', '2027-02-03')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(buildPeriods('month', '2026-10-01', '2026-10-31')).toEqual(['2026-10']);
  });

  it('theo năm', () => {
    expect(buildPeriods('year', '2025-12-31', '2027-01-01')).toEqual(['2025', '2026', '2027']);
  });
});
