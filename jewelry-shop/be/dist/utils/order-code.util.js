import { randomInt } from 'node:crypto';
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
export function formatVietnamDate(date) {
    const shifted = new Date(date.getTime() + VIETNAM_OFFSET_MS);
    const pad = (n) => String(n).padStart(2, '0');
    return `${shifted.getUTCFullYear()}${pad(shifted.getUTCMonth() + 1)}${pad(shifted.getUTCDate())}`;
}
export function generateOrderCode(now = new Date()) {
    return `LG${formatVietnamDate(now)}-${String(randomInt(0, 1_000_000)).padStart(6, '0')}`;
}
export function startOfVietnamDay(isoDate) {
    return new Date(`${isoDate}T00:00:00+07:00`);
}
//# sourceMappingURL=order-code.util.js.map