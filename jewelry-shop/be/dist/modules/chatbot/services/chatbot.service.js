var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { FaqRepository } from '../../faqs/repositories/faq.repository.js';
import { SiteInfoService } from '../../site-info/services/site-info.service.js';
import { ChatbotRateLimitRepository } from '../repositories/chatbot-rate-limit.repository.js';
import { pickBestMatch, rankFaqs } from './chatbot-matcher.js';
const GREETING = 'Xin chào! Mình là trợ lý ảo của cửa hàng. Bạn muốn hỏi về bảo hành, đổi trả, giao hàng hay thanh toán?';
const MAX_SUGGESTIONS = 4;
let ChatbotService = class ChatbotService {
    faqs;
    siteInfo;
    rateLimit;
    constructor(faqs, siteInfo, rateLimit) {
        this.faqs = faqs;
        this.siteInfo = siteInfo;
        this.rateLimit = rateLimit;
    }
    async suggestions() {
        const faqs = await this.faqs.findActive();
        return { greeting: GREETING, suggestions: faqs.slice(0, MAX_SUGGESTIONS).map(this.toSuggestion) };
    }
    async ask(ip, message) {
        const limit = await this.rateLimit.hit(ip);
        if (!limit.allowed) {
            throw new BusinessException(ErrorCode.RATE_LIMITED, `Bạn hỏi quá nhiều, vui lòng thử lại sau ${limit.retryAfterSeconds} giây`, HttpStatus.TOO_MANY_REQUESTS, { retryAfterSeconds: limit.retryAfterSeconds });
        }
        const faqs = await this.faqs.findActive();
        const ranked = rankFaqs(message, faqs);
        const best = pickBestMatch(ranked);
        if (best) {
            const others = faqs.filter((faq) => faq.id !== best.faq.id).slice(0, MAX_SUGGESTIONS);
            return {
                answer: best.faq.answer,
                matched: this.toSuggestion(best.faq),
                suggestions: others.map(this.toSuggestion),
                fallback: false,
            };
        }
        const info = await this.siteInfo.get();
        return {
            answer: `Xin lỗi, mình chưa tìm thấy câu trả lời phù hợp. Bạn vui lòng gọi hotline ${info.hotline} hoặc email ${info.email} để được hỗ trợ.`,
            matched: null,
            suggestions: ranked.slice(0, MAX_SUGGESTIONS).map(({ faq }) => this.toSuggestion(faq)),
            fallback: true,
        };
    }
    toSuggestion = (faq) => ({ id: faq.id, question: faq.question });
};
ChatbotService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [FaqRepository,
        SiteInfoService,
        ChatbotRateLimitRepository])
], ChatbotService);
export { ChatbotService };
//# sourceMappingURL=chatbot.service.js.map