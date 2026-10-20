var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CacheService_1;
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service.js';
const CACHE_PREFIX = 'jewelry:cache:';
let CacheService = CacheService_1 = class CacheService {
    redis;
    logger = new Logger(CacheService_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async get(name) {
        try {
            const raw = await this.redis.client.get(CACHE_PREFIX + name);
            return raw ? JSON.parse(raw) : null;
        }
        catch (error) {
            this.logger.warn(`Đọc cache ${name} lỗi: ${error.message}`);
            return null;
        }
    }
    async set(name, value, ttlSeconds) {
        try {
            await this.redis.client.set(CACHE_PREFIX + name, JSON.stringify(value), 'EX', ttlSeconds);
        }
        catch (error) {
            this.logger.warn(`Ghi cache ${name} lỗi: ${error.message}`);
        }
    }
    async delete(...names) {
        try {
            await this.redis.client.del(...names.map((name) => CACHE_PREFIX + name));
        }
        catch (error) {
            this.logger.warn(`Xóa cache ${names.join(',')} lỗi: ${error.message}`);
        }
    }
};
CacheService = CacheService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService])
], CacheService);
export { CacheService };
//# sourceMappingURL=cache.service.js.map