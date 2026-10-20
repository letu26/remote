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
let ResetTicketRepository = class ResetTicketRepository {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    key(tokenHash) {
        return `jewelry:reset:${tokenHash}`;
    }
    async save(tokenHash, userId, ttlSeconds) {
        await this.redis.client.set(this.key(tokenHash), String(userId), 'EX', ttlSeconds);
    }
    async consume(tokenHash) {
        const value = await this.redis.client.getdel(this.key(tokenHash));
        return value ? Number(value) : null;
    }
};
ResetTicketRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService])
], ResetTicketRepository);
export { ResetTicketRepository };
//# sourceMappingURL=reset-ticket.repository.js.map