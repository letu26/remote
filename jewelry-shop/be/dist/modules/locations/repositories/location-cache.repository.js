var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LocationCacheRepository_1;
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service.js';
const CACHE_PREFIX = 'jewelry:cache:';
const CACHE_TTL_SECONDS = 86400;
let LocationCacheRepository = LocationCacheRepository_1 = class LocationCacheRepository {
    redis;
    logger = new Logger(LocationCacheRepository_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async get(key) {
        try {
            const raw = await this.redis.client.get(CACHE_PREFIX + key);
            return raw ? JSON.parse(raw) : null;
        }
        catch (error) {
            this.logger.warn(`Đọc cache ${key} lỗi: ${error.message}`);
            return null;
        }
    }
    async set(key, value) {
        try {
            await this.redis.client.set(CACHE_PREFIX + key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
        }
        catch (error) {
            this.logger.warn(`Ghi cache ${key} lỗi: ${error.message}`);
        }
    }
};
LocationCacheRepository = LocationCacheRepository_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService])
], LocationCacheRepository);
export { LocationCacheRepository };
//# sourceMappingURL=location-cache.repository.js.map