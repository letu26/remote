import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EntityManager } from 'typeorm';
import { durationToMs } from '../../../utils/duration.util.js';
import { BlacklistReason } from '../models/token-blacklist.entity.js';
import { TokenAuthState, TokenBlacklistRepository } from '../repositories/token-blacklist.repository.js';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly tokenLifetimeMs: number;

  constructor(
    private readonly blacklist: TokenBlacklistRepository,
    config: ConfigService,
  ) {
    this.tokenLifetimeMs = durationToMs(config.get<string>('JWT_EXPIRES_IN') ?? '1d');
  }

  getAuthState(userId: number, jti: string, iatMs: number): Promise<TokenAuthState> {
    return this.blacklist.findAuthState(userId, jti, iatMs);
  }

  /** expSeconds là claim `exp` của token (giây). */
  async revokeToken(userId: number, jti: string, expSeconds: number): Promise<void> {
    await this.blacklist.addToken(userId, jti, new Date(expSeconds * 1000), BlacklistReason.LOGOUT);
    this.cleanupInBackground();
  }

  /** Đổi mật khẩu + thu hồi mọi token cũ (một transaction). Trả false nếu tài khoản không tồn tại. */
  async changePasswordAndRevokeAll(
    userId: number,
    passwordHash: string,
    reason: BlacklistReason.CHANGE_PASSWORD | BlacklistReason.RESET_PASSWORD,
  ): Promise<boolean> {
    const now = new Date();
    const ok = await this.blacklist.setPasswordAndRevokeAll(
      userId,
      passwordHash,
      reason,
      now,
      new Date(now.getTime() + this.tokenLifetimeMs),
    );
    if (ok) this.cleanupInBackground();
    return ok;
  }

  /**
   * Ghi thu hồi mọi token cũ của người dùng trong transaction của người gọi (ví dụ đổi quyền).
   * Cột reason là enum cố định trong DB nên dùng RESET_PASSWORD (thu hồi do quản trị viên can thiệp tài khoản).
   */
  async revokeAllInTransaction(manager: EntityManager, userId: number): Promise<void> {
    const now = new Date();
    await this.blacklist.insertRevokeAll(
      manager,
      userId,
      BlacklistReason.RESET_PASSWORD,
      now,
      new Date(now.getTime() + this.tokenLifetimeMs),
    );
    this.cleanupInBackground();
  }

  /** Dọn dòng quá hạn, không chờ và không làm lỗi request chính. */
  private cleanupInBackground(): void {
    this.blacklist
      .deleteExpired(new Date())
      .catch((error: unknown) => this.logger.warn(`Blacklist cleanup failed: ${(error as Error)?.message}`));
  }
}
