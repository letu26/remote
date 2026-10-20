import { DataSource, type EntityManager, Repository } from 'typeorm';
import { UserStatus } from '../../users/models/user.entity.js';
import { BlacklistReason, TokenBlacklist } from '../models/token-blacklist.entity.js';
export interface TokenAuthState {
    status: UserStatus | null;
    revoked: boolean;
}
export declare class TokenBlacklistRepository {
    private readonly repo;
    private readonly dataSource;
    constructor(repo: Repository<TokenBlacklist>, dataSource: DataSource);
    findAuthState(userId: number, jti: string, iatMs: number): Promise<TokenAuthState>;
    addToken(userId: number, jti: string, expiresAt: Date, reason: BlacklistReason): Promise<boolean>;
    setPasswordAndRevokeAll(userId: number, passwordHash: string, reason: BlacklistReason, revokedAt: Date, expiresAt: Date): Promise<boolean>;
    insertRevokeAll(manager: EntityManager, userId: number, reason: BlacklistReason, revokedAt: Date, expiresAt: Date): Promise<void>;
    deleteExpired(now: Date): Promise<void>;
}
