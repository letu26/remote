/** Phần thuần (không I/O) của chatbot theo từ khóa: chuẩn hóa, tách từ khóa, chấm điểm, xếp hạng. */

export const KEYWORD_SCORE = 3;
export const MIN_MATCH_SCORE = 3;

/** Từ dừng nhỏ: không tính điểm khi đối chiếu từ trong câu hỏi FAQ. */
export const STOP_WORDS: ReadonlySet<string> = new Set([
  'la',
  'co',
  'khong',
  'the',
  'nao',
  'cho',
  'toi',
  'minh',
  'ban',
  'shop',
  'va',
  'cua',
  'gi',
  'duoc',
]);

export interface FaqCandidate {
  id: number;
  question: string;
  keywords: string | null;
  sortOrder: number;
}

export interface ScoredFaq<T extends FaqCandidate = FaqCandidate> {
  faq: T;
  score: number;
}

/** Chữ thường, bỏ dấu tiếng Việt, đ -> d, bỏ dấu câu, gộp khoảng trắng. */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Tách chuỗi từ khóa cách nhau dấu phẩy thành các cụm đã chuẩn hóa, bỏ rỗng và trùng. */
export function parseKeywords(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const phrases = raw
    .split(',')
    .map(normalizeText)
    .filter((phrase) => phrase.length > 0);
  return [...new Set(phrases)];
}

/** Cụm từ (đã chuẩn hóa) có xuất hiện trong thông điệp (đã chuẩn hóa) theo ranh giới từ không. */
export function containsPhrase(normalizedMessage: string, normalizedPhrase: string): boolean {
  if (!normalizedPhrase) return false;
  return ` ${normalizedMessage} `.includes(` ${normalizedPhrase} `);
}

/** Các từ khác biệt (>= 3 ký tự, không phải từ dừng) của một câu đã chuẩn hóa. */
export function significantWords(normalized: string): string[] {
  return [...new Set(normalized.split(' ').filter((word) => word.length >= 3 && !STOP_WORDS.has(word)))];
}

/** Điểm: 3 cho mỗi từ khóa/cụm xuất hiện + 1 cho mỗi từ khác biệt của câu hỏi xuất hiện trong thông điệp. */
export function scoreFaq(normalizedMessage: string, faq: FaqCandidate): number {
  const messageWords = new Set(normalizedMessage.split(' ').filter(Boolean));
  const keywordScore =
    parseKeywords(faq.keywords).filter((phrase) => containsPhrase(normalizedMessage, phrase)).length * KEYWORD_SCORE;
  const questionScore = significantWords(normalizeText(faq.question)).filter((word) => messageWords.has(word)).length;
  return keywordScore + questionScore;
}

/** Xếp hạng: điểm giảm dần, hòa thì sortOrder nhỏ hơn, rồi id nhỏ hơn. */
export function rankFaqs<T extends FaqCandidate>(message: string, faqs: readonly T[]): ScoredFaq<T>[] {
  const normalizedMessage = normalizeText(message);
  return faqs
    .map((faq) => ({ faq, score: scoreFaq(normalizedMessage, faq) }))
    .sort((a, b) => b.score - a.score || a.faq.sortOrder - b.faq.sortOrder || a.faq.id - b.faq.id);
}

/** FAQ khớp tốt nhất nếu đạt ngưỡng, ngược lại null (fallback). */
export function pickBestMatch<T extends FaqCandidate>(ranked: readonly ScoredFaq<T>[]): ScoredFaq<T> | null {
  const best = ranked[0];
  return best && best.score >= MIN_MATCH_SCORE ? best : null;
}
