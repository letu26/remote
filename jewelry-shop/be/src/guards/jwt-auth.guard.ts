import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AccessDeniedException, AuthException, ErrorCode } from '../exceptions/index.js';
import type { AuthenticatedUser, JwtPayload } from '../modules/auth/models/jwt-payload.js';
import { TokenBlacklistService } from '../modules/token-blacklist/services/token-blacklist.service.js';
import { UserStatus } from '../modules/users/models/user.entity.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const header = request.headers.authorization;
    if (!header) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, 'Bạn chưa đăng nhập');
    }
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new AuthException(ErrorCode.TOKEN_INVALID, 'Token không hợp lệ');
    }

    const payload = await this.verify(token);

    // Một truy vấn: token bị thu hồi? tài khoản còn tồn tại/active?
    const state = await this.blacklist.getAuthState(payload.id, payload.jti, payload.iatMs);
    if (state.revoked) {
      throw new AuthException(
        ErrorCode.TOKEN_REVOKED,
        'Phiên đăng nhập đã hết hiệu lực, vui lòng đăng nhập lại',
      );
    }
    if (!state.status) {
      throw new AuthException(ErrorCode.TOKEN_INVALID, 'Token không hợp lệ');
    }
    if (state.status !== UserStatus.ACTIVE) {
      throw new AccessDeniedException('Tài khoản của bạn đã bị khóa', ErrorCode.ACCOUNT_LOCKED);
    }

    request.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      iatMs: payload.iatMs,
      exp: payload.exp as number,
    };
    return true;
  }

  private async verify(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { algorithms: ['HS256'] });
      if (
        typeof payload.id !== 'number' ||
        !payload.email ||
        !payload.role ||
        typeof payload.jti !== 'string' ||
        typeof payload.iatMs !== 'number' ||
        typeof payload.exp !== 'number'
      ) {
        throw new AuthException(ErrorCode.TOKEN_INVALID, 'Token không hợp lệ');
      }
      return payload;
    } catch (error) {
      if (error instanceof AuthException) throw error;
      if ((error as Error)?.name === 'TokenExpiredError') {
        throw new AuthException(ErrorCode.TOKEN_EXPIRED, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      this.logger.warn(`Invalid token: ${(error as Error)?.name ?? 'unknown'}`);
      throw new AuthException(ErrorCode.TOKEN_INVALID, 'Token không hợp lệ');
    }
  }
}
