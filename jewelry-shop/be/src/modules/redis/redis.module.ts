import { Global, Module } from '@nestjs/common';
import { CacheService } from './services/cache.service.js';
import { RedisService } from './services/redis.service.js';

@Global()
@Module({ providers: [RedisService, CacheService], exports: [RedisService, CacheService] })
export class RedisModule {}
