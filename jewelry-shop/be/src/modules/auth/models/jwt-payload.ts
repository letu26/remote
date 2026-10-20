import type { UserRole } from '../../users/models/user.entity.js';

export interface JwtPayload {
  sub: number;
  id: number;
  email: string;
  role: UserRole;
  /** Mã duy nhất của token (dùng cho blacklist). */
  jti: string;
  /** Thời điểm cấp token (mili giây). */
  iatMs: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  jti: string;
  iatMs: number;
  /** Thời điểm hết hạn token (giây, theo chuẩn JWT). */
  exp: number;
}
