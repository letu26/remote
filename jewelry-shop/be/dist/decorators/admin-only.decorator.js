import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { UserRole } from '../modules/users/models/user.entity.js';
import { Roles } from './roles.decorator.js';
export const AdminOnly = () => applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles(UserRole.ADMIN));
//# sourceMappingURL=admin-only.decorator.js.map