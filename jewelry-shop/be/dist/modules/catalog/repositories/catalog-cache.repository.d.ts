import { RedisService } from '../../redis/services/redis.service.js';
export type CacheName = 'categories' | 'materials' | 'gemstones' | 'collections';
export declare class CatalogCacheRepository {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    get<T>(name: CacheName): Promise<T | null>;
    set(name: CacheName, value: unknown): Promise<void>;
    invalidate(...names: CacheName[]): Promise<void>;
}
