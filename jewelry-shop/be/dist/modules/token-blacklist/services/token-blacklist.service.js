var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TokenBlacklistService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { durationToMs } from '../../../utils/duration.util.js';
import { BlacklistReason } from '../models/token-blacklist.entity.js';
import { TokenBlacklistRepository } from '../repositories/token-blacklist.repository.js';
let TokenBlacklistService = TokenBlacklistService_1 = class TokenBlacklistService {
    blacklist;
    logger = new Logger(TokenBlacklistService_1.name);
    tokenLifetimeMs;
    constructor(blacklist, config) {
        this.blacklist = blacklist;
        this.tokenLifetimeMs = durationToMs(config.get('JWT_EXPIRES_IN') ?? '1d');
    }
    getAuthState(userId, jti, iatMs) {
        return this.blacklist.findAuthState(userId, jti, iatMs);
    }
    async revokeToken(userId, jti, expSeconds) {
        await this.blacklist.addToken(userId, jti, new Date(expSeconds * 1000), BlacklistReason.LOGOUT);
        this.cleanupInBackground();
    }
    async changePasswordAndRevokeAll(userId, passwordHash, reason) {
        const now = new Date();
        const ok = await this.blacklist.setPasswordAndRevokeAll(userId, passwordHash, reason, now, new Date(now.getTime() + this.tokenLifetimeMs));
        if (ok)
            this.cleanupInBackground();
        return ok;
    }
    async revokeAllInTransaction(manager, userId) {
        const now = new Date();
        await this.blacklist.insertRevokeAll(manager, userId, BlacklistReason.RESET_PASSWORD, now, new Date(now.getTime() + this.tokenLifetimeMs));
        this.cleanupInBackground();
    }
    cleanupInBackground() {
        this.blacklist
            .deleteExpired(new Date())
            .catch((error) => this.logger.warn(`Blacklist cleanup failed: ${error?.message}`));
    }
};
TokenBlacklistService = TokenBlacklistService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TokenBlacklistRepository,
        ConfigService])
], TokenBlacklistService);
export { TokenBlacklistService };
//# sourceMappingURL=token-blacklist.service.js.map