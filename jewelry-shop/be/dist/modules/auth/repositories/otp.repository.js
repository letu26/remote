var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';
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
let OtpRepository = class OtpRepository {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    otpKey(emailHash) {
        return `jewelry:otp:forgot:${emailHash}`;
    }
    cooldownKey(emailHash) {
        return `jewelry:otp:cooldown:${emailHash}`;
    }
    async acquireCooldown(emailHash, ttlSeconds) {
        const key = this.cooldownKey(emailHash);
        const result = await this.redis.client.set(key, '1', 'EX', ttlSeconds, 'NX');
        if (result === 'OK')
            return 0;
        const remaining = await this.redis.client.ttl(key);
        return Math.max(remaining, 1);
    }
    async saveOtp(emailHash, hash, ttlSeconds) {
        await this.redis.client.set(this.otpKey(emailHash), JSON.stringify({ hash, attempts: 0 }), 'EX', ttlSeconds);
    }
    async findOtpHash(emailHash) {
        const raw = await this.redis.client.get(this.otpKey(emailHash));
        if (!raw)
            return null;
        return JSON.parse(raw).hash;
    }
    async registerWrongAttempt(emailHash, maxAttempts) {
        const result = Number(await this.redis.client.eval(INCREMENT_ATTEMPTS_LUA, 1, this.otpKey(emailHash), String(maxAttempts)));
        if (result === -2)
            return { status: 'missing' };
        if (result === -1)
            return { status: 'locked' };
        return { status: 'wrong', attempts: result };
    }
    async consumeOtp(emailHash) {
        return (await this.redis.client.del(this.otpKey(emailHash))) === 1;
    }
};
OtpRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService])
], OtpRepository);
export { OtpRepository };
//# sourceMappingURL=otp.repository.js.map