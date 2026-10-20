import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';

const CACHE_PREFIX = 'jewelry:cache:';
const CACHE_TTL_SECONDS = 300;

export type CacheName = 'categories' | 'materials' | 'gemstones' | 'collections';

/** Cache Redis cho danh mục/bộ lọc. Redis lỗi thì bỏ qua cache, không làm hỏng request. */
@Injectable()
export class CatalogCacheRepository {
  private readonly logger = new Logger(CatalogCacheRepository.name);

  constructor(private readonly redis: RedisService) {}

  async get<T>(name: CacheName): Promise<T | null> {
    try {
      const raw = await this.redis.client.get(CACHE_PREFIX + name);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Đọc cache ${name} lỗi: ${(error as Error).message}`);
      return null;
    }
  }

  async set(name: CacheName, value: unknown): Promise<void> {
    try {
      await this.redis.client.set(CACHE_PREFIX + name, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
    } catch (error) {
      this.logger.warn(`Ghi cache ${name} lỗi: ${(error as Error).message}`);
    }
  }

  async invalidate(...names: CacheName[]): Promise<void> {
    try {
      await this.redis.client.del(...names.map((name) => CACHE_PREFIX + name));
    } catch (error) {
      this.logger.warn(`Xóa cache ${names.join(',')} lỗi: ${(error as Error).message}`);
    }
  }
}
