import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { AccessDeniedException } from '../exceptions/index.js';
import type { AuthenticatedUser } from '../modules/auth/models/jwt-payload.js';
import type { UserRole } from '../modules/users/models/user.entity.js';

/** Dùng sau JwtAuthGuard: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(...). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user;
    if (!user || !required.includes(user.role)) {
      throw new AccessDeniedException();
    }
    return true;
  }
}
