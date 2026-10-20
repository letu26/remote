import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';

export enum BlacklistScope {
  TOKEN = 'token',
  ALL_BEFORE = 'all_before',
}

export enum BlacklistReason {
  LOGOUT = 'logout',
  CHANGE_PASSWORD = 'change_password',
  RESET_PASSWORD = 'reset_password',
}

/** Bảng được tạo bằng SQL riêng (database/changes/001_otp_blacklist.sql), entity chỉ khai báo cột. */
@Entity('token_blacklist')
export class TokenBlacklist extends BaseEntity {
  @Column({ unsigned: true })
  userId: number;

  @Column({ type: 'enum', enum: BlacklistScope })
  scope: BlacklistScope;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  jti: string | null;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  issuedBefore: Date | null;

  @Column({ type: 'enum', enum: BlacklistReason })
  reason: BlacklistReason;

  @Column({ type: 'datetime' })
  expiresAt: Date;
}
