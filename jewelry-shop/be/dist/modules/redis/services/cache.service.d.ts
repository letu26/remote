import { RedisService } from './redis.service.js';
export declare class CacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    get<T>(name: string): Promise<T | null>;
    set(name: string, value: unknown, ttlSeconds: number): Promise<void>;
    delete(...names: string[]): Promise<void>;
}
