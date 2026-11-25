import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
/** Dùng khi model chính lỗi, hết hạn mức (hạn mức tính riêng theo model) hoặc quá thời gian. */
const DEFAULT_FALLBACK_MODEL = 'gemini-3.1-flash-lite';
/** Gồm cả token suy luận của model, nên đặt rộng hơn độ dài câu trả lời mong muốn. */
const MAX_OUTPUT_TOKENS = 8192;

/** Mỗi tính năng một khóa riêng; để trống thì dùng khóa chung GEMINI_API_KEY (nếu có). */
const FEATURE_KEYS = {
  chatbot: 'GEMINI_API_KEY_CHATBOT',
  revenue: 'GEMINI_API_KEY_REVENUE',
  recommend: 'GEMINI_API_KEY_RECOMMEND',
} as const;

export type GeminiFeature = keyof typeof FEATURE_KEYS;

type ThinkingLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface Attempt {
  model: string;
  thinkingLevel: ThinkingLevel;
  timeoutMs: number;
}

/**
 * Mức suy luận và thời gian chờ theo tính năng; model dự phòng suy luận ít hơn để trả lời nhanh.
 * Tổng hai thời gian chờ phải ngắn hơn thời gian chờ của trình duyệt (chat 30s, doanh thu 40s, gợi ý 15s).
 */
const FEATURE_SETTINGS: Record<GeminiFeature, { thinkingLevel: ThinkingLevel; timeoutMs: number; fallbackTimeoutMs: number }> = {
  chatbot: { thinkingLevel: 'MEDIUM', timeoutMs: 16_000, fallbackTimeoutMs: 10_000 },
  revenue: { thinkingLevel: 'HIGH', timeoutMs: 22_000, fallbackTimeoutMs: 14_000 },
  recommend: { thinkingLevel: 'MEDIUM', timeoutMs: 7_000, fallbackTimeoutMs: 4_000 },
};

export interface GeminiTurn {
  role: 'user' | 'model';
  text: string;
}

interface RawResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
}

/**
 * Gọi API Gemini (generateContent). Chỉ làm việc với HTTP, không chứa quy tắc nghiệp vụ.
 * Mọi lỗi (chưa có khóa, hết hạn mức, quá thời gian, bị chặn) đều trả null để nơi gọi dùng phương án dự phòng.
 * Nơi gọi KHÔNG được đưa tên, số điện thoại, email, địa chỉ của khách vào nội dung gửi đi.
 */
@Injectable()
export class GeminiGateway {
  private readonly logger = new Logger(GeminiGateway.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(feature: GeminiFeature): boolean {
    return Boolean(this.apiKey(feature));
  }

  async generate(feature: GeminiFeature, system: string, turns: GeminiTurn[]): Promise<string | null> {
    const apiKey = this.apiKey(feature);
    if (!apiKey) return null;
    const { thinkingLevel, timeoutMs, fallbackTimeoutMs } = FEATURE_SETTINGS[feature];
    const model = this.config.get<string>('GEMINI_MODEL')?.trim() || DEFAULT_MODEL;
    const fallback = this.config.get<string>('GEMINI_FALLBACK_MODEL')?.trim() || DEFAULT_FALLBACK_MODEL;
    const answer = await this.call(apiKey, system, turns, { model, thinkingLevel, timeoutMs });
    if (answer !== null || fallback === model) return answer;
    return this.call(apiKey, system, turns, { model: fallback, thinkingLevel: 'LOW', timeoutMs: fallbackTimeoutMs });
  }

  private async call(apiKey: string, system: string, turns: GeminiTurn[], attempt: Attempt): Promise<string | null> {
    const { model, thinkingLevel, timeoutMs } = attempt;
    try {
      const response = await fetch(`${ENDPOINT}${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        // Khóa gửi qua header để không nằm trong URL (URL hay bị ghi log).
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, thinkingConfig: { thinkingLevel } },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        this.logger.warn(`Gemini HTTP ${response.status} (model ${model})`);
        return null;
      }
      const candidate = ((await response.json()) as RawResponse).candidates?.[0];
      const text = candidate?.content?.parts
        ?.filter((part) => !part.thought)
        .map((part) => part.text ?? '')
        .join('')
        .trim();
      // Chỉ nhận câu trả lời hoàn chỉnh: bị cắt hoặc bị chặn thì coi như không có.
      if (!text || candidate?.finishReason !== 'STOP') {
        this.logger.warn(`Gemini (model ${model}) không trả lời trọn vẹn: ${candidate?.finishReason ?? 'không có candidate'}`);
        return null;
      }
      return toPlainText(text);
    } catch (error) {
      this.logger.warn(`Gọi Gemini (model ${model}) lỗi: ${(error as Error).message}`);
      return null;
    }
  }

  private apiKey(feature: GeminiFeature): string | undefined {
    const read = (name: string) => this.config.get<string>(name)?.trim() || undefined;
    return read(FEATURE_KEYS[feature]) ?? read('GEMINI_API_KEY');
  }
}

/** Giao diện hiển thị văn bản thuần, nên bỏ ký hiệu Markdown nếu model vẫn dùng. */
export function toPlainText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^(\s*)\*\s+/gm, '$1- ');
}
