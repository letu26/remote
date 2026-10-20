import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';

export type OtpAttemptResult = { status: 'missing' } | { status: 'wrong'; attempts: number } | { status: 'locked' };

/** Tăng số lần sai atomic; chạm giới hạn thì xóa OTP. Trả -2 nếu key không còn, -1 nếu bị khóa. */
const INCREMENT_ATTEMPTS_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then return -2 end
local ttl = redis.call('PTTL', KEYS[1])
if ttl <= 0 then return -2 end
local data = cjson.decode(raw)
data.attempts = (data.attempts or 0) + 1
if data.attempts >= tonumber(ARGV[1]) then
  redis.call('DEL', KEYS[1])
  return -1
end
redis.call('SET', KEYS[1], cjson.encode(data), 'PX', ttl)
return data.attempts
`;

@Injectable()
export class OtpRepository {
  constructor(private readonly redis: RedisService) {}

  private otpKey(emailHash: string): string {
    return `jewelry:otp:forgot:${emailHash}`;
  }

  private cooldownKey(emailHash: string): string {
    return `jewelry:otp:cooldown:${emailHash}`;
  }

  /** Đặt cooldown atomic (SET NX). Trả 0 nếu đặt được, ngược lại số giây còn phải chờ. */
  async acquireCooldown(emailHash: string, ttlSeconds: number): Promise<number> {
    const key = this.cooldownKey(emailHash);
    const result = await this.redis.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    if (result === 'OK') return 0;
    const remaining = await this.redis.client.ttl(key);
    return Math.max(remaining, 1);
  }

  async saveOtp(emailHash: string, hash: string, ttlSeconds: number): Promise<void> {
    await this.redis.client.set(this.otpKey(emailHash), JSON.stringify({ hash, attempts: 0 }), 'EX', ttlSeconds);
  }

  async findOtpHash(emailHash: string): Promise<string | null> {
    const raw = await this.redis.client.get(this.otpKey(emailHash));
    if (!raw) return null;
    return (JSON.parse(raw) as { hash: string }).hash;
  }

  async registerWrongAttempt(emailHash: string, maxAttempts: number): Promise<OtpAttemptResult> {
    const result = Number(
      await this.redis.client.eval(INCREMENT_ATTEMPTS_LUA, 1, this.otpKey(emailHash), String(maxAttempts)),
    );
    if (result === -2) return { status: 'missing' };
    if (result === -1) return { status: 'locked' };
    return { status: 'wrong', attempts: result };
  }

  /** Xóa OTP; trả true chỉ cho đúng một người gọi (chặn hai request đúng OTP song song). */
  async consumeOtp(emailHash: string): Promise<boolean> {
    return (await this.redis.client.del(this.otpKey(emailHash))) === 1;
  }
}
