const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
export const MAX_RANGE_DAYS = 366;
export const DEFAULT_RANGE_DAYS = 30;
export const MAX_PERIODS = { day: 366, month: 60, year: 20 };
export function vietnamIsoDate(date) {
    return new Date(date.getTime() + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
}
export function isValidIsoDate(value) {
    const match = ISO_DATE.exec(value);
    if (!match)
        return false;
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export function addDaysIso(isoDate, days) {
    return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}
export function diffDaysIso(fromIso, toIso) {
    return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);
}
export function vietnamDayStartUtc(isoDate) {
    return new Date(Date.parse(`${isoDate}T00:00:00Z`) - VIETNAM_OFFSET_MS);
}
export function firstDayOfMonthIso(isoDate) {
    return `${isoDate.slice(0, 7)}-01`;
}
export function firstDayOfNextMonthIso(isoDate) {
    const [year, month] = [Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7))];
    return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
}
export function resolveStatsRange(from, to, now) {
    const errors = [];
    if (to !== undefined && !isValidIsoDate(to))
        errors.push({ field: 'to', message: 'Ngày phải theo dạng yyyy-MM-dd hợp lệ' });
    if (from !== undefined && !isValidIsoDate(from))
        errors.push({ field: 'from', message: 'Ngày phải theo dạng yyyy-MM-dd hợp lệ' });
    if (errors.length)
        return { ok: false, errors };
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
export function buildPeriods(granularity, fromIso, toIso) {
    if (granularity === 'day') {
        const periods = [];
        for (let day = fromIso; day <= toIso; day = addDaysIso(day, 1))
            periods.push(day);
        return periods;
    }
    if (granularity === 'month') {
        const periods = [];
        for (let month = fromIso.slice(0, 7); month <= toIso.slice(0, 7);) {
            periods.push(month);
            const [year, m] = [Number(month.slice(0, 4)), Number(month.slice(5, 7))];
            month = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`;
        }
        return periods;
    }
    const periods = [];
    for (let year = Number(fromIso.slice(0, 4)); year <= Number(toIso.slice(0, 4)); year += 1)
        periods.push(String(year));
    return periods;
}
//# sourceMappingURL=vietnam-time.util.js.map