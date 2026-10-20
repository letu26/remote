import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service.js';

const CACHE_PREFIX = 'jewelry:cache:';

/** Cache JSON theo khóa `jewelry:cache:<name>`; Redis lỗi thì bỏ qua cache (không làm hỏng request). */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redis: RedisService) {}

  async get<T>(name: string): Promise<T | null> {
    try {
      const raw = await this.redis.client.get(CACHE_PREFIX + name);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Đọc cache ${name} lỗi: ${(error as Error).message}`);
      return null;
    }
  }

  async set(name: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.client.set(CACHE_PREFIX + name, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Ghi cache ${name} lỗi: ${(error as Error).message}`);
    }
  }

  async delete(...names: string[]): Promise<void> {
    try {
      await this.redis.client.del(...names.map((name) => CACHE_PREFIX + name));
    } catch (error) {
      this.logger.warn(`Xóa cache ${names.join(',')} lỗi: ${(error as Error).message}`);
    }
  }
}
