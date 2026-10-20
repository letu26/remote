import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';

export const CHATBOT_LIMIT = 20;
export const CHATBOT_WINDOW_SECONDS = 60;

/** INCR + EXPIRE nguyên tử trong một script Lua; trả về [số lần trong cửa sổ, giây còn lại]. */
const INCREMENT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
if ttl < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]) ttl = tonumber(ARGV[1]) end
return {count, ttl}
`;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

@Injectable()
export class ChatbotRateLimitRepository {
  private readonly logger = new Logger(ChatbotRateLimitRepository.name);

  constructor(private readonly redis: RedisService) {}

  /** Redis lỗi thì không chặn (ghi log). Khóa theo IP, cửa sổ cố định 60 giây. */
  async hit(ip: string): Promise<RateLimitResult> {
    try {
      const [count, ttl] = (await this.redis.client.eval(
        INCREMENT_SCRIPT,
        1,
        `jewelry:ratelimit:chatbot:${ip}`,
        CHATBOT_WINDOW_SECONDS,
      )) as [number, number];
      return { allowed: count <= CHATBOT_LIMIT, retryAfterSeconds: Math.max(1, ttl) };
    } catch (error) {
      this.logger.warn(`Redis lỗi khi giới hạn tốc độ chatbot, bỏ qua: ${(error as Error).message}`);
      return { allowed: true, retryAfterSeconds: 0 };
    }
  }
}
