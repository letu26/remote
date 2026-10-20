var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { hashPassword, verifyPassword } from '../../../utils/crypto.util.js';
import { getDuplicateEntryValue } from '../../../utils/db-error.util.js';
import { UserRole } from '../models/user.entity.js';
import { BlacklistReason } from '../../token-blacklist/models/token-blacklist.entity.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserRepository } from '../repositories/user.repository.js';
export function toUserResponse(user) {
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
let UsersService = UsersService_1 = class UsersService {
    users;
    tokenBlacklist;
    logger = new Logger(UsersService_1.name);
    constructor(users, tokenBlacklist) {
        this.users = users;
        this.tokenBlacklist = tokenBlacklist;
    }
    async createUser(input) {
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
        }
        catch (error) {
            throw this.translateDuplicate(error, input.email, input.phone);
        }
    }
    async getProfile(userId) {
        const user = await this.users.findById(userId);
        if (!user)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
        return toUserResponse(user);
    }
    async updateProfile(userId, dto) {
        const current = await this.users.findById(userId);
        if (!current)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
        const changes = {
            ...(dto.fullName !== undefined && dto.fullName !== current.fullName ? { fullName: dto.fullName } : {}),
            ...(dto.email !== undefined && dto.email !== current.email ? { email: dto.email } : {}),
            ...(dto.phone !== undefined && dto.phone !== current.phone ? { phone: dto.phone } : {}),
        };
        await this.assertNoConflict(changes.email, changes.phone, userId);
        try {
            await this.users.updateProfile(userId, changes);
        }
        catch (error) {
            throw this.translateDuplicate(error, changes.email, changes.phone);
        }
        return this.getProfile(userId);
    }
    async changePassword(userId, dto) {
        const user = await this.users.findByIdWithPassword(userId);
        if (!user)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
        if (!(await verifyPassword(dto.currentPassword, user.passwordHash))) {
            throw new ValidationException([{ field: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' }]);
        }
        const passwordHash = await hashPassword(dto.newPassword);
        const ok = await this.tokenBlacklist.changePasswordAndRevokeAll(userId, passwordHash, BlacklistReason.CHANGE_PASSWORD);
        if (!ok)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
        this.logger.log(`Password changed userId=${userId}`);
    }
    async assertNoConflict(email, phone, excludeId) {
        const conflicts = await this.users.findConflicts(email, phone, excludeId);
        if (phone && conflicts.some((u) => u.phone === phone))
            throw this.phoneExists();
        if (email && conflicts.some((u) => u.email === email))
            throw this.emailExists();
    }
    translateDuplicate(error, email, phone) {
        const value = getDuplicateEntryValue(error);
        if (value === null)
            return error;
        if (phone && value === phone)
            return this.phoneExists();
        if (email && value === email)
            return this.emailExists();
        return error;
    }
    phoneExists() {
        return new BusinessException(ErrorCode.PHONE_ALREADY_EXISTS, 'Số điện thoại đã được sử dụng', HttpStatus.CONFLICT);
    }
    emailExists() {
        return new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email đã được sử dụng', HttpStatus.CONFLICT);
    }
};
UsersService = UsersService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UserRepository,
        TokenBlacklistService])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map