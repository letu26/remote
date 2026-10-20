import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { Roles } from '../../../decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../guards/roles.guard.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { UserRole } from '../../users/models/user.entity.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  @Get('ping')
  ping(@CurrentUser() user: AuthenticatedUser) {
    return { message: 'pong', admin: { id: user.id, email: user.email } };
  }
}
