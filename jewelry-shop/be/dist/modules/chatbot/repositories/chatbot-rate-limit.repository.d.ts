import { RedisService } from '../../redis/services/redis.service.js';
export declare const CHATBOT_LIMIT = 20;
export declare const CHATBOT_WINDOW_SECONDS = 60;
export interface RateLimitResult {
    allowed: boolean;
    retryAfterSeconds: number;
}
export declare class ChatbotRateLimitRepository {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    hit(ip: string): Promise<RateLimitResult>;
}
