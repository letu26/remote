import { FaqRepository } from '../../faqs/repositories/faq.repository.js';
import { SiteInfoService } from '../../site-info/services/site-info.service.js';
import { ChatbotRateLimitRepository } from '../repositories/chatbot-rate-limit.repository.js';
export interface Suggestion {
    id: number;
    question: string;
}
export declare class ChatbotService {
    private readonly faqs;
    private readonly siteInfo;
    private readonly rateLimit;
    constructor(faqs: FaqRepository, siteInfo: SiteInfoService, rateLimit: ChatbotRateLimitRepository);
    suggestions(): Promise<{
        greeting: string;
        suggestions: Suggestion[];
    }>;
    ask(ip: string, message: string): Promise<{
        answer: string;
        matched: Suggestion;
        suggestions: Suggestion[];
        fallback: boolean;
    } | {
        answer: string;
        matched: null;
        suggestions: Suggestion[];
        fallback: boolean;
    }>;
    private toSuggestion;
}
