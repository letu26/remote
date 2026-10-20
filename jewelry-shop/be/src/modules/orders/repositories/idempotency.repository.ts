import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';

const TTL_SECONDS = 600;
const PROCESSING = 'processing';

export type IdempotencyState =
  | { kind: 'acquired' }
  | { kind: 'in_progress' }
  | { kind: 'done'; orderCode: string }
  /** Redis không dùng được: vẫn xử lý bình thường, chỉ mất chống đặt trùng. */
  | { kind: 'unavailable' };

/** Khóa chống đặt trùng trong Redis: jewelry:idem:order:<userId>:<key>. */
@Injectable()
export class IdempotencyRepository {
  private readonly logger = new Logger(IdempotencyRepository.name);

  constructor(private readonly redis: RedisService) {}

  private keyOf(userId: number, key: string): string {
    return `jewelry:idem:order:${userId}:${key}`;
  }

  async begin(userId: number, key: string): Promise<IdempotencyState> {
    const redisKey = this.keyOf(userId, key);
    try {
      const acquired = await this.redis.client.set(redisKey, PROCESSING, 'EX', TTL_SECONDS, 'NX');
      if (acquired === 'OK') return { kind: 'acquired' };
      const value = await this.redis.client.get(redisKey);
      if (value === null || value === PROCESSING) return { kind: 'in_progress' };
      return { kind: 'done', orderCode: value };
    } catch (error) {
      this.logger.warn(`Redis lỗi khi khóa Idempotency-Key, bỏ qua chống đặt trùng: ${(error as Error).message}`);
      return { kind: 'unavailable' };
    }
  }

  async complete(userId: number, key: string, orderCode: string): Promise<void> {
    try {
      await this.redis.client.set(this.keyOf(userId, key), orderCode, 'EX', TTL_SECONDS);
    } catch (error) {
      this.logger.warn(`Không ghi được kết quả Idempotency-Key: ${(error as Error).message}`);
    }
  }

  async release(userId: number, key: string): Promise<void> {
    try {
      await this.redis.client.del(this.keyOf(userId, key));
    } catch (error) {
      this.logger.warn(`Không xóa được Idempotency-Key: ${(error as Error).message}`);
    }
  }
}
