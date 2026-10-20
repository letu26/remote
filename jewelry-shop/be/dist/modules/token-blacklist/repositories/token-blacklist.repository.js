var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { User } from '../../users/models/user.entity.js';
import { BlacklistScope, TokenBlacklist } from '../models/token-blacklist.entity.js';
let TokenBlacklistRepository = class TokenBlacklistRepository {
    repo;
    dataSource;
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
    }
    async findAuthState(userId, jti, iatMs) {
        const rows = await this.dataSource.query(`SELECT
         (SELECT u.status FROM users u WHERE u.id = ?) AS status,
         EXISTS(
           SELECT 1 FROM token_blacklist b
           WHERE (b.scope = 'token' AND b.jti = ?)
              OR (b.scope = 'all_before' AND b.userId = ? AND b.issuedBefore > ?)
         ) AS revoked`, [userId, jti, userId, new Date(iatMs)]);
        const row = rows[0];
        return { status: row?.status ?? null, revoked: Number(row?.revoked) === 1 };
    }
    async addToken(userId, jti, expiresAt, reason) {
        const result = await this.repo
            .createQueryBuilder()
            .insert()
            .values({ userId, scope: BlacklistScope.TOKEN, jti, issuedBefore: null, reason, expiresAt })
            .orIgnore()
            .execute();
        return result.raw.affectedRows === 1;
    }
    setPasswordAndRevokeAll(userId, passwordHash, reason, revokedAt, expiresAt) {
        return this.dataSource.transaction(async (manager) => {
            const updated = await manager.update(User, { id: userId }, { passwordHash });
            if (!updated.affected)
                return false;
            await manager.insert(TokenBlacklist, {
                userId,
                scope: BlacklistScope.ALL_BEFORE,
                jti: null,
                issuedBefore: revokedAt,
                reason,
                expiresAt,
            });
            return true;
        });
    }
    async insertRevokeAll(manager, userId, reason, revokedAt, expiresAt) {
        await manager.insert(TokenBlacklist, {
            userId,
            scope: BlacklistScope.ALL_BEFORE,
            jti: null,
            issuedBefore: revokedAt,
            reason,
            expiresAt,
        });
    }
    async deleteExpired(now) {
        await this.repo.delete({ expiresAt: LessThan(now) });
    }
};
TokenBlacklistRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(TokenBlacklist)),
    __param(1, InjectDataSource()),
    __metadata("design:paramtypes", [Repository,
        DataSource])
], TokenBlacklistRepository);
export { TokenBlacklistRepository };
//# sourceMappingURL=token-blacklist.repository.js.map