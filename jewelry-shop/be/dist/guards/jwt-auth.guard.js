var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JwtAuthGuard_1;
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessDeniedException, AuthException, ErrorCode } from '../exceptions/index.js';
import { TokenBlacklistService } from '../modules/token-blacklist/services/token-blacklist.service.js';
import { UserStatus } from '../modules/users/models/user.entity.js';
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard {
    jwtService;
    blacklist;
    logger = new Logger(JwtAuthGuard_1.name);
    constructor(jwtService, blacklist) {
        this.jwtService = jwtService;
        this.blacklist = blacklist;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const header = request.headers.authorization;
        if (!header) {
            throw new AuthException(ErrorCode.UNAUTHORIZED, 'Bạn chưa đăng nhập');
        }
        const [scheme, token] = header.split(' ');
        if (scheme?.toLowerCase() !== 'bearer' || !token) {
            throw new AuthException(ErrorCode.TOKEN_INVALID, 'Token không hợp lệ');
        }
        const payload = await this.verify(token);
        const state = await this.blacklist.getAuthState(payload.id, payload.jti, payload.iatMs);
        if (state.revoked) {
            throw new AuthException(ErrorCode.TOKEN_REVOKED, 'Phiên đăng nhập đã hết hiệu lực, vui lòng đăng nhập lại');
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
            exp: payload.exp,
        };
        return true;
    }
    async verify(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token, { algorithms: ['HS256'] });
            if (typeof payload.id !== 'number' ||
                !payload.email ||
                !payload.role ||
                typeof payload.jti !== 'string' ||
                typeof payload.iatMs !== 'number' ||
                typeof payload.exp !== 'number') {
                throw new AuthException(ErrorCode.TOKEN_INVALID, 'Token không hợp lệ');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof AuthException)
                throw error;
            if (error?.name === 'TokenExpiredError') {
                throw new AuthException(ErrorCode.TOKEN_EXPIRED, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            }
            this.logger.warn(`Invalid token: ${error?.name ?? 'unknown'}`);
            throw new AuthException(ErrorCode.TOKEN_INVALID, 'Token không hợp lệ');
        }
    }
};
JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService,
        TokenBlacklistService])
], JwtAuthGuard);
export { JwtAuthGuard };
//# sourceMappingURL=jwt-auth.guard.js.map