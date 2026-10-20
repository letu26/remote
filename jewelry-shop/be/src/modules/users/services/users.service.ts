import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { hashPassword, verifyPassword } from '../../../utils/crypto.util.js';
import { getDuplicateEntryValue } from '../../../utils/db-error.util.js';
import type { ChangePasswordDto, UpdateProfileDto, UserResponse } from '../dtos/user.dtos.js';
import { User, UserRole } from '../models/user.entity.js';
import { BlacklistReason } from '../../token-blacklist/models/token-blacklist.entity.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserRepository } from '../repositories/user.repository.js';

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

  /** Luôn tạo role user; không nhận role từ client. */
  async createUser(input: RegisterInput): Promise<User> {
    await this.assertNoConflict(input.email, input.phone);
    const passwordHash = await hashPassword(input.password);
    try {
      const user = await this.users.create({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: UserRole.USER,
      });
      this.logger.log(`User registered id=${user.id}`);
      return user;
    } catch (error) {
      throw this.translateDuplicate(error, input.email, input.phone);
    }
  }

  async getProfile(userId: number): Promise<UserResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
    return toUserResponse(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserResponse> {
    const current = await this.users.findById(userId);
    if (!current) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng', HttpStatus.NOT_FOUND);

    const changes = {
      ...(dto.fullName !== undefined && dto.fullName !== current.fullName ? { fullName: dto.fullName } : {}),
      ...(dto.email !== undefined && dto.email !== current.email ? { email: dto.email } : {}),
      ...(dto.phone !== undefined && dto.phone !== current.phone ? { phone: dto.phone } : {}),
    };
    await this.assertNoConflict(changes.email, changes.phone, userId);
    try {
      await this.users.updateProfile(userId, changes);
    } catch (error) {
      throw this.translateDuplicate(error, changes.email, changes.phone);
    }
    return this.getProfile(userId);
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
    if (!(await verifyPassword(dto.currentPassword, user.passwordHash))) {
      throw new ValidationException([{ field: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' }]);
    }
    const passwordHash = await hashPassword(dto.newPassword);
    const ok = await this.tokenBlacklist.changePasswordAndRevokeAll(userId, passwordHash, BlacklistReason.CHANGE_PASSWORD);
    if (!ok) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
    this.logger.log(`Password changed userId=${userId}`);
  }

  private async assertNoConflict(email?: string, phone?: string, excludeId?: number): Promise<void> {
    const conflicts = await this.users.findConflicts(email, phone, excludeId);
    if (phone && conflicts.some((u) => u.phone === phone)) throw this.phoneExists();
    if (email && conflicts.some((u) => u.email === email)) throw this.emailExists();
  }

  /** Xử lý race condition: hai request cùng qua bước kiểm tra, DB từ chối bằng duplicate key. */
  private translateDuplicate(error: unknown, email?: string, phone?: string): unknown {
    const value = getDuplicateEntryValue(error);
    if (value === null) return error;
    if (phone && value === phone) return this.phoneExists();
    if (email && value === email) return this.emailExists();
    return error;
  }

  private phoneExists() {
    return new BusinessException(ErrorCode.PHONE_ALREADY_EXISTS, 'Số điện thoại đã được sử dụng', HttpStatus.CONFLICT);
  }

  private emailExists() {
    return new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email đã được sử dụng', HttpStatus.CONFLICT);
  }
}
