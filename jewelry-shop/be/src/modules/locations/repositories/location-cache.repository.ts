import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';

const CACHE_PREFIX = 'jewelry:cache:';
const CACHE_TTL_SECONDS = 86400;

/** Cache Redis cho địa giới hành chính; Redis lỗi thì bỏ qua cache. */
@Injectable()
export class LocationCacheRepository {
  private readonly logger = new Logger(LocationCacheRepository.name);

  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.client.get(CACHE_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Đọc cache ${key} lỗi: ${(error as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      await this.redis.client.set(CACHE_PREFIX + key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
    } catch (error) {
      this.logger.warn(`Ghi cache ${key} lỗi: ${(error as Error).message}`);
    }
  }
}
