import { RedisService } from '../../redis/services/redis.service.js';
export declare class LocationCacheRepository {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown): Promise<void>;
}
