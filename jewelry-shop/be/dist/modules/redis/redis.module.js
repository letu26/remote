var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Global, Module } from '@nestjs/common';
import { CacheService } from './services/cache.service.js';
import { RedisService } from './services/redis.service.js';
let RedisModule = class RedisModule {
};
RedisModule = __decorate([
    Global(),
    Module({ providers: [RedisService, CacheService], exports: [RedisService, CacheService] })
], RedisModule);
export { RedisModule };
//# sourceMappingURL=redis.module.js.map