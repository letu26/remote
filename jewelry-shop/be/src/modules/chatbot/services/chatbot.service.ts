import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { FaqRepository } from '../../faqs/repositories/faq.repository.js';
import { SiteInfoService } from '../../site-info/services/site-info.service.js';
import { ChatbotRateLimitRepository } from '../repositories/chatbot-rate-limit.repository.js';
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
  ) {}

  async suggestions() {
    const faqs = await this.faqs.findActive();
    return { greeting: GREETING, suggestions: faqs.slice(0, MAX_SUGGESTIONS).map(this.toSuggestion) };
  }

  /** Nội dung tin nhắn chỉ dùng để chấm điểm trong bộ nhớ, không ghi log và không lưu. */
  async ask(ip: string, message: string) {
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
    const ranked = rankFaqs(message, faqs);
    const best = pickBestMatch(ranked);

    if (best) {
      const others = faqs.filter((faq) => faq.id !== best.faq.id).slice(0, MAX_SUGGESTIONS); // faqs đã theo sortOrder
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

  private toSuggestion = (faq: { id: number; question: string }): Suggestion => ({ id: faq.id, question: faq.question });
}
