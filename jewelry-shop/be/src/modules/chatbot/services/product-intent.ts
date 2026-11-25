/** Phần thuần (không I/O): đọc nhu cầu mua hàng từ câu hỏi và che thông tin cá nhân trước khi gửi cho AI. */
import { normalizeText } from './chatbot-matcher.js';

export interface PriceRange {
  minPrice?: number;
  maxPrice?: number;
}

const UNIT: Record<string, number> = { trieu: 1_000_000, tr: 1_000_000, cu: 1_000_000, k: 1_000, nghin: 1_000, ngan: 1_000 };
const AMOUNT = /(\d+(?:[.,]\d+)?)\s*(trieu|tr|cu|nghin|ngan|k)\b/g;

/** "dưới 5 triệu", "trên 2tr", "từ 2 đến 5 triệu", "khoảng 3 triệu", "500k". Không thấy số tiền thì trả {}. */
export function parsePriceRange(message: string): PriceRange {
  const text = message
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    // "từ 2 đến 5 triệu": số đầu dùng chung đơn vị với số sau.
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:den|toi|-)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|cu|nghin|ngan|k)\b/g, '$1 $3 den $2 $3');
  const amounts = [...text.matchAll(AMOUNT)].map((m) => Math.round(Number(m[1].replace(',', '.')) * UNIT[m[2]]));
  if (!amounts.length) return {};
  if (amounts.length > 1) return { minPrice: Math.min(...amounts), maxPrice: Math.max(...amounts) };
  const [amount] = amounts;
  if (/\b(duoi|toi da|khong qua|it hon)\b/.test(text)) return { maxPrice: amount };
  if (/\b(tren|toi thieu|hon|tu)\b/.test(text)) return { minPrice: amount };
  return { minPrice: Math.round(amount * 0.7), maxPrice: Math.round(amount * 1.3) };
}

const words = (value: string) => ` ${value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;

/**
 * Các mục (danh mục, loại đá) được nhắc tên trong câu hỏi. Câu có dấu thì so có dấu ("nhận" không phải "nhẫn");
 * câu gõ không dấu mới so không dấu.
 */
export function mentioned<T extends { name: string }>(message: string, items: readonly T[]): T[] {
  const nfc = message.normalize('NFC');
  const accented = /[^\u0000-\u007f]/.test(nfc);
  const haystack = accented ? words(nfc) : ` ${normalizeText(nfc)} `;
  return items.filter((item) => {
    const needle = accented ? words(item.name.normalize('NFC')) : ` ${normalizeText(item.name)} `;
    return needle.trim() !== '' && haystack.includes(needle);
  });
}

/** Che email và số điện thoại khách gõ vào khung chat. */
export function redactPersonalData(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]')
    .replace(/(?:\+?84|0)(?:[ .-]?\d){8,10}\b/g, '[số điện thoại]');
}
