import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { FaqRepository } from '../../faqs/repositories/faq.repository.js';
import { SiteInfoService } from '../../site-info/services/site-info.service.js';
import type { ChatHistoryDto } from '../dtos/chatbot.dtos.js';
import { ChatbotRateLimitRepository } from '../repositories/chatbot-rate-limit.repository.js';
import { ChatbotAiService } from './chatbot-ai.service.js';
import { pickBestMatch, rankFaqs } from './chatbot-matcher.js';

const GREETING = 'Xin chào! Mình là trợ lý ảo của cửa hàng. Bạn muốn hỏi về bảo hành, đổi trả, giao hàng hay thanh toán?';
const MAX_SUGGESTIONS = 4;

export interface Suggestion {
  id: number;
  question: string;
}

@Injectable()
export class ChatbotService {
  constructor(
    private readonly faqs: FaqRepository,
    private readonly siteInfo: SiteInfoService,
    private readonly rateLimit: ChatbotRateLimitRepository,
    private readonly ai: ChatbotAiService,
  ) {}

  async suggestions() {
    const faqs = await this.faqs.findActive();
    return { greeting: GREETING, suggestions: faqs.slice(0, MAX_SUGGESTIONS).map(this.toSuggestion) };
  }

  /**
   * Có khóa AI thì AI trả lời; không có hoặc AI lỗi thì trả lời theo câu hỏi thường gặp.
   * Nội dung tin nhắn không ghi log; khi dùng AI, câu hỏi (đã che email, số điện thoại) được gửi cho Google Gemini.
   */
  async ask(ip: string, message: string, history: ChatHistoryDto[] = []) {
    const limit = await this.rateLimit.hit(ip);
    if (!limit.allowed) {
      throw new BusinessException(
        ErrorCode.RATE_LIMITED,
        `Bạn hỏi quá nhiều, vui lòng thử lại sau ${limit.retryAfterSeconds} giây`,
        HttpStatus.TOO_MANY_REQUESTS,
        { retryAfterSeconds: limit.retryAfterSeconds },
      );
    }

    const faqs = await this.faqs.findActive();
    const reply = await this.ai.answer(message, history, faqs);
    if (reply) {
      return {
        answer: reply.answer,
        matched: null,
        suggestions: faqs.slice(0, MAX_SUGGESTIONS).map(this.toSuggestion),
        fallback: false,
        products: reply.products,
      };
    }

    const ranked = rankFaqs(message, faqs);
    const best = pickBestMatch(ranked);

    if (best) {
      const others = faqs.filter((faq) => faq.id !== best.faq.id).slice(0, MAX_SUGGESTIONS); // faqs đã theo sortOrder
      return {
        answer: best.faq.answer,
        matched: this.toSuggestion(best.faq),
        suggestions: others.map(this.toSuggestion),
        fallback: false,
        products: [],
      };
    }

    const info = await this.siteInfo.get();
    return {
      answer: `Xin lỗi, mình chưa tìm thấy câu trả lời phù hợp. Bạn vui lòng gọi hotline ${info.hotline} hoặc email ${info.email} để được hỗ trợ.`,
      matched: null,
      suggestions: ranked.slice(0, MAX_SUGGESTIONS).map(({ faq }) => this.toSuggestion(faq)),
      fallback: true,
      products: [],
    };
  }

  private toSuggestion = (faq: { id: number; question: string }): Suggestion => ({ id: faq.id, question: faq.question });
}
