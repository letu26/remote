var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessDeniedException, AuthException, ErrorCode } from '../../../exceptions/index.js';
import { DUMMY_PASSWORD_HASH, verifyPassword } from '../../../utils/crypto.util.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserStatus } from '../../users/models/user.entity.js';
import { UserRepository } from '../../users/repositories/user.repository.js';
import { toUserResponse, UsersService } from '../../users/services/users.service.js';
let AuthService = AuthService_1 = class AuthService {
    usersService;
    users;
    jwtService;
    tokenBlacklist;
    logger = new Logger(AuthService_1.name);
    constructor(usersService, users, jwtService, tokenBlacklist) {
        this.usersService = usersService;
        this.users = users;
        this.jwtService = jwtService;
        this.tokenBlacklist = tokenBlacklist;
    }
    async register(dto) {
        const user = await this.usersService.createUser(dto);
        return { user: toUserResponse(user) };
    }
    async login(dto) {
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
        const payload = {
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
    async logout(user) {
        await this.tokenBlacklist.revokeToken(user.id, user.jti, user.exp);
        this.logger.log(`Logout userId=${user.id}`);
        return { message: 'Đăng xuất thành công' };
    }
};
AuthService = AuthService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UsersService,
        UserRepository,
        JwtService,
        TokenBlacklistService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map