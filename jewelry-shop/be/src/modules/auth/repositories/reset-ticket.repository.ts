import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';

@Injectable()
export class ResetTicketRepository {
  constructor(private readonly redis: RedisService) {}

  private key(tokenHash: string): string {
    return `jewelry:reset:${tokenHash}`;
  }

  async save(tokenHash: string, userId: number, ttlSeconds: number): Promise<void> {
    await this.redis.client.set(this.key(tokenHash), String(userId), 'EX', ttlSeconds);
  }

  /** Lấy và xóa atomic (GETDEL): chỉ một request nhận được userId. */
  async consume(tokenHash: string): Promise<number | null> {
    const value = await this.redis.client.getdel(this.key(tokenHash));
    return value ? Number(value) : null;
  }
}
