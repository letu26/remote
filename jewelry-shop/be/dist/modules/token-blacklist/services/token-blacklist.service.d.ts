import { ConfigService } from '@nestjs/config';
import type { EntityManager } from 'typeorm';
import { BlacklistReason } from '../models/token-blacklist.entity.js';
import { TokenAuthState, TokenBlacklistRepository } from '../repositories/token-blacklist.repository.js';
export declare class TokenBlacklistService {
    private readonly blacklist;
    private readonly logger;
    private readonly tokenLifetimeMs;
    constructor(blacklist: TokenBlacklistRepository, config: ConfigService);
    getAuthState(userId: number, jti: string, iatMs: number): Promise<TokenAuthState>;
    revokeToken(userId: number, jti: string, expSeconds: number): Promise<void>;
    changePasswordAndRevokeAll(userId: number, passwordHash: string, reason: BlacklistReason.CHANGE_PASSWORD | BlacklistReason.RESET_PASSWORD): Promise<boolean>;
    revokeAllInTransaction(manager: EntityManager, userId: number): Promise<void>;
    private cleanupInBackground;
}
