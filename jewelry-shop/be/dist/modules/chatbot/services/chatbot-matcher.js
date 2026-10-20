export const KEYWORD_SCORE = 3;
export const MIN_MATCH_SCORE = 3;
export const STOP_WORDS = new Set([
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
export function normalizeText(input) {
    return input
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[đĐ]/g, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}
export function parseKeywords(raw) {
    if (!raw)
        return [];
    const phrases = raw
        .split(',')
        .map(normalizeText)
        .filter((phrase) => phrase.length > 0);
    return [...new Set(phrases)];
}
export function containsPhrase(normalizedMessage, normalizedPhrase) {
    if (!normalizedPhrase)
        return false;
    return ` ${normalizedMessage} `.includes(` ${normalizedPhrase} `);
}
export function significantWords(normalized) {
    return [...new Set(normalized.split(' ').filter((word) => word.length >= 3 && !STOP_WORDS.has(word)))];
}
export function scoreFaq(normalizedMessage, faq) {
    const messageWords = new Set(normalizedMessage.split(' ').filter(Boolean));
    const keywordScore = parseKeywords(faq.keywords).filter((phrase) => containsPhrase(normalizedMessage, phrase)).length * KEYWORD_SCORE;
    const questionScore = significantWords(normalizeText(faq.question)).filter((word) => messageWords.has(word)).length;
    return keywordScore + questionScore;
}
export function rankFaqs(message, faqs) {
    const normalizedMessage = normalizeText(message);
    return faqs
        .map((faq) => ({ faq, score: scoreFaq(normalizedMessage, faq) }))
        .sort((a, b) => b.score - a.score || a.faq.sortOrder - b.faq.sortOrder || a.faq.id - b.faq.id);
}
export function pickBestMatch(ranked) {
    const best = ranked[0];
    return best && best.score >= MIN_MATCH_SCORE ? best : null;
}
//# sourceMappingURL=chatbot-matcher.js.map