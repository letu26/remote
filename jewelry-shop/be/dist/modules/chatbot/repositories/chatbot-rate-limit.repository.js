var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatbotRateLimitRepository_1;
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';
export const CHATBOT_LIMIT = 20;
export const CHATBOT_WINDOW_SECONDS = 60;
const INCREMENT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
if ttl < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]) ttl = tonumber(ARGV[1]) end
return {count, ttl}
`;
let ChatbotRateLimitRepository = ChatbotRateLimitRepository_1 = class ChatbotRateLimitRepository {
    redis;
    logger = new Logger(ChatbotRateLimitRepository_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async hit(ip) {
        try {
            const [count, ttl] = (await this.redis.client.eval(INCREMENT_SCRIPT, 1, `jewelry:ratelimit:chatbot:${ip}`, CHATBOT_WINDOW_SECONDS));
            return { allowed: count <= CHATBOT_LIMIT, retryAfterSeconds: Math.max(1, ttl) };
        }
        catch (error) {
            this.logger.warn(`Redis lỗi khi giới hạn tốc độ chatbot, bỏ qua: ${error.message}`);
            return { allowed: true, retryAfterSeconds: 0 };
        }
    }
};
ChatbotRateLimitRepository = ChatbotRateLimitRepository_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService])
], ChatbotRateLimitRepository);
export { ChatbotRateLimitRepository };
//# sourceMappingURL=chatbot-rate-limit.repository.js.map