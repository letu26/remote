var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IdempotencyRepository_1;
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';
const TTL_SECONDS = 600;
const PROCESSING = 'processing';
let IdempotencyRepository = IdempotencyRepository_1 = class IdempotencyRepository {
    redis;
    logger = new Logger(IdempotencyRepository_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    keyOf(userId, key) {
        return `jewelry:idem:order:${userId}:${key}`;
    }
    async begin(userId, key) {
        const redisKey = this.keyOf(userId, key);
        try {
            const acquired = await this.redis.client.set(redisKey, PROCESSING, 'EX', TTL_SECONDS, 'NX');
            if (acquired === 'OK')
                return { kind: 'acquired' };
            const value = await this.redis.client.get(redisKey);
            if (value === null || value === PROCESSING)
                return { kind: 'in_progress' };
            return { kind: 'done', orderCode: value };
        }
        catch (error) {
            this.logger.warn(`Redis lỗi khi khóa Idempotency-Key, bỏ qua chống đặt trùng: ${error.message}`);
            return { kind: 'unavailable' };
        }
    }
    async complete(userId, key, orderCode) {
        try {
            await this.redis.client.set(this.keyOf(userId, key), orderCode, 'EX', TTL_SECONDS);
        }
        catch (error) {
            this.logger.warn(`Không ghi được kết quả Idempotency-Key: ${error.message}`);
        }
    }
    async release(userId, key) {
        try {
            await this.redis.client.del(this.keyOf(userId, key));
        }
        catch (error) {
            this.logger.warn(`Không xóa được Idempotency-Key: ${error.message}`);
        }
    }
};
IdempotencyRepository = IdempotencyRepository_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService])
], IdempotencyRepository);
export { IdempotencyRepository };
//# sourceMappingURL=idempotency.repository.js.map