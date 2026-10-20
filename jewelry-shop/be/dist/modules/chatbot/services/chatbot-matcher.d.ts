export declare const KEYWORD_SCORE = 3;
export declare const MIN_MATCH_SCORE = 3;
export declare const STOP_WORDS: ReadonlySet<string>;
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
export declare function normalizeText(input: string): string;
export declare function parseKeywords(raw: string | null | undefined): string[];
export declare function containsPhrase(normalizedMessage: string, normalizedPhrase: string): boolean;
export declare function significantWords(normalized: string): string[];
export declare function scoreFaq(normalizedMessage: string, faq: FaqCandidate): number;
export declare function rankFaqs<T extends FaqCandidate>(message: string, faqs: readonly T[]): ScoredFaq<T>[];
export declare function pickBestMatch<T extends FaqCandidate>(ranked: readonly ScoredFaq<T>[]): ScoredFaq<T> | null;
