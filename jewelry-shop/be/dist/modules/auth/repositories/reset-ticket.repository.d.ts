import { RedisService } from '../../redis/services/redis.service.js';
export declare class ResetTicketRepository {
    private readonly redis;
    constructor(redis: RedisService);
    private key;
    save(tokenHash: string, userId: number, ttlSeconds: number): Promise<void>;
    consume(tokenHash: string): Promise<number | null>;
}
