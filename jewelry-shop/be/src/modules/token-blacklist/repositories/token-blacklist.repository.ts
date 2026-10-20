import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, LessThan, Repository } from 'typeorm';
import { User, UserStatus } from '../../users/models/user.entity.js';
import { BlacklistReason, BlacklistScope, TokenBlacklist } from '../models/token-blacklist.entity.js';

export interface TokenAuthState {
  /** null nếu tài khoản không còn tồn tại. */
  status: UserStatus | null;
  revoked: boolean;
}

@Injectable()
export class TokenBlacklistRepository {
  constructor(
    @InjectRepository(TokenBlacklist) private readonly repo: Repository<TokenBlacklist>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Một truy vấn duy nhất: trạng thái tài khoản + token có bị thu hồi không (dùng chỉ mục). */
  async findAuthState(userId: number, jti: string, iatMs: number): Promise<TokenAuthState> {
    const rows: Array<{ status: UserStatus | null; revoked: number | string | null }> = await this.dataSource.query(
      `SELECT
         (SELECT u.status FROM users u WHERE u.id = ?) AS status,
         EXISTS(
           SELECT 1 FROM token_blacklist b
           WHERE (b.scope = 'token' AND b.jti = ?)
              OR (b.scope = 'all_before' AND b.userId = ? AND b.issuedBefore > ?)
         ) AS revoked`,
      [userId, jti, userId, new Date(iatMs)],
    );
    const row = rows[0];
    return { status: row?.status ?? null, revoked: Number(row?.revoked) === 1 };
  }

  /** Thu hồi một token. Trả false nếu jti đã có trong blacklist (ghi trùng song song). */
  async addToken(userId: number, jti: string, expiresAt: Date, reason: BlacklistReason): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .values({ userId, scope: BlacklistScope.TOKEN, jti, issuedBefore: null, reason, expiresAt })
      .orIgnore()
      .execute();
    return (result.raw as { affectedRows?: number }).affectedRows === 1;
  }

  /** Đổi mật khẩu và thu hồi mọi token cũ trong cùng một transaction. Trả false nếu user không tồn tại. */
  setPasswordAndRevokeAll(
    userId: number,
    passwordHash: string,
    reason: BlacklistReason,
    revokedAt: Date,
    expiresAt: Date,
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const updated = await manager.update(User, { id: userId }, { passwordHash });
      if (!updated.affected) return false;
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

  /** Thu hồi mọi token phát hành trước revokedAt, chạy trong transaction của người gọi (manager truyền vào). */
  async insertRevokeAll(
    manager: EntityManager,
    userId: number,
    reason: BlacklistReason,
    revokedAt: Date,
    expiresAt: Date,
  ): Promise<void> {
    await manager.insert(TokenBlacklist, {
      userId,
      scope: BlacklistScope.ALL_BEFORE,
      jti: null,
      issuedBefore: revokedAt,
      reason,
      expiresAt,
    });
  }

  async deleteExpired(now: Date): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(now) });
  }
}
