import type { ErrorDetail } from '../exceptions/error-codes.js';
export declare const MAX_RANGE_DAYS = 366;
export declare const DEFAULT_RANGE_DAYS = 30;
export declare const MAX_PERIODS: {
    readonly day: 366;
    readonly month: 60;
    readonly year: 20;
};
export type Granularity = keyof typeof MAX_PERIODS;
export declare function vietnamIsoDate(date: Date): string;
export declare function isValidIsoDate(value: string): boolean;
export declare function addDaysIso(isoDate: string, days: number): string;
export declare function diffDaysIso(fromIso: string, toIso: string): number;
export declare function vietnamDayStartUtc(isoDate: string): Date;
export declare function firstDayOfMonthIso(isoDate: string): string;
export declare function firstDayOfNextMonthIso(isoDate: string): string;
export interface StatsRange {
    from: string;
    to: string;
    startUtc: Date;
    endUtcExclusive: Date;
}
export type RangeResult = {
    ok: true;
    range: StatsRange;
} | {
    ok: false;
    errors: ErrorDetail[];
};
export declare function resolveStatsRange(from: string | undefined, to: string | undefined, now: Date): RangeResult;
export declare function buildPeriods(granularity: Granularity, fromIso: string, toIso: string): string[];
