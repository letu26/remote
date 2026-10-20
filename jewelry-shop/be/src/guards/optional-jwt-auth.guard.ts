import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard.js';

/**
 * Xác thực TÙY CHỌN: có token hợp lệ (đã qua kiểm tra chữ ký, hạn, blacklist, trạng thái tài khoản) thì gắn
 * request.user; không có token hoặc token sai/hết hạn/bị thu hồi thì vẫn cho qua như khách vãng lai.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.headers.authorization) return true;
    try {
      await this.jwtAuthGuard.canActivate(context);
    } catch {
      // Bỏ qua: coi như chưa đăng nhập.
    }
    return true;
  }
}
