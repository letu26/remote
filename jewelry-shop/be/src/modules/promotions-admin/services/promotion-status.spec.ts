import { describe, expect, it } from 'vitest';
import { computePromotionStatus } from './promotion-status.js';

const now = new Date('2026-10-18T00:00:00Z');
const at = (iso: string) => new Date(iso);

describe('computePromotionStatus', () => {
  it('active khi đang trong khoảng (kể cả đúng biên)', () => {
    expect(computePromotionStatus({ isActive: true, startsAt: at('2026-10-17T00:00:00Z'), endsAt: at('2026-10-19T00:00:00Z') }, now)).toBe('active');
    expect(computePromotionStatus({ isActive: true, startsAt: now, endsAt: now }, now)).toBe('active');
  });

  it('upcoming khi chưa tới giờ bắt đầu', () => {
    expect(computePromotionStatus({ isActive: true, startsAt: at('2026-10-18T00:00:01Z'), endsAt: at('2026-11-01T00:00:00Z') }, now)).toBe('upcoming');
  });

  it('expired khi đã quá giờ kết thúc', () => {
    expect(computePromotionStatus({ isActive: true, startsAt: at('2026-09-01T00:00:00Z'), endsAt: at('2026-10-17T23:59:59Z') }, now)).toBe('expired');
  });

  it('disabled được ưu tiên trước mọi trạng thái khác', () => {
    expect(computePromotionStatus({ isActive: false, startsAt: at('2026-10-17T00:00:00Z'), endsAt: at('2026-10-19T00:00:00Z') }, now)).toBe('disabled');
    expect(computePromotionStatus({ isActive: false, startsAt: at('2026-01-01T00:00:00Z'), endsAt: at('2026-01-02T00:00:00Z') }, now)).toBe('disabled');
  });

  it('expired được ưu tiên trước upcoming khi dữ liệu mâu thuẫn', () => {
    expect(computePromotionStatus({ isActive: true, startsAt: at('2026-12-01T00:00:00Z'), endsAt: at('2026-09-01T00:00:00Z') }, now)).toBe('expired');
  });
});
