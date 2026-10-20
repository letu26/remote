import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { ChangePasswordDto, UpdateProfileDto, type UserResponse } from '../dtos/user.dtos.js';
import { UsersService } from '../services/users.service.js';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    return this.usersService.getProfile(user.id);
  }

  @Patch()
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto): Promise<UserResponse> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(user.id, dto);
    return { message: 'Đổi mật khẩu thành công, vui lòng đăng nhập lại' };
  }
}
