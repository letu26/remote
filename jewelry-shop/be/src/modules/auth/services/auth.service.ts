import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessDeniedException, AuthException, ErrorCode } from '../../../exceptions/index.js';
import { DUMMY_PASSWORD_HASH, verifyPassword } from '../../../utils/crypto.util.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import type { UserResponse } from '../../users/dtos/user.dtos.js';
import { UserStatus } from '../../users/models/user.entity.js';
import { UserRepository } from '../../users/repositories/user.repository.js';
import { toUserResponse, UsersService } from '../../users/services/users.service.js';
import type { LoginDto, RegisterDto } from '../dtos/auth.dtos.js';
import type { AuthenticatedUser, JwtPayload } from '../models/jwt-payload.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly users: UserRepository,
    private readonly jwtService: JwtService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: UserResponse }> {
    const user = await this.usersService.createUser(dto);
    return { user: toUserResponse(user) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: Omit<UserResponse, 'status' | 'createdAt'> }> {
    const user = await this.users.findByPhoneWithPassword(dto.phone);
    const passwordOk = await verifyPassword(dto.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !passwordOk) {
      this.logger.warn('Login failed: invalid credentials');
      throw new AuthException(ErrorCode.INVALID_CREDENTIALS, 'Số điện thoại hoặc mật khẩu không đúng');
    }
    if (user.status === UserStatus.LOCKED) {
      this.logger.warn(`Login blocked: locked account id=${user.id}`);
      throw new AccessDeniedException('Tài khoản của bạn đã bị khóa', ErrorCode.ACCOUNT_LOCKED);
    }

    const payload: JwtPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(),
      iatMs: Date.now(),
    };
    const accessToken = await this.jwtService.signAsync(payload);
    this.logger.log(`Login success id=${user.id}`);
    return {
      accessToken,
      user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role },
    };
  }

  async logout(user: AuthenticatedUser): Promise<{ message: string }> {
    await this.tokenBlacklist.revokeToken(user.id, user.jti, user.exp);
    this.logger.log(`Logout userId=${user.id}`);
    return { message: 'Đăng xuất thành công' };
  }
}
