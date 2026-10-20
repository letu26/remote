var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PasswordRecoveryService_1;
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { generateOtp, generateResetToken, hashPassword, hmacSha256, safeEqualHex, sha256, } from '../../../utils/crypto.util.js';
import { MailService } from '../../mail/services/mail.service.js';
import { BlacklistReason } from '../../token-blacklist/models/token-blacklist.entity.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserStatus } from '../../users/models/user.entity.js';
import { UserRepository } from '../../users/repositories/user.repository.js';
import { OtpRepository } from '../repositories/otp.repository.js';
import { ResetTicketRepository } from '../repositories/reset-ticket.repository.js';
let PasswordRecoveryService = PasswordRecoveryService_1 = class PasswordRecoveryService {
    users;
    otps;
    tickets;
    tokenBlacklist;
    mailService;
    logger = new Logger(PasswordRecoveryService_1.name);
    otpSecret;
    otpTtl;
    maxAttempts;
    cooldown;
    ticketTtl;
    constructor(users, otps, tickets, tokenBlacklist, mailService, config) {
        this.users = users;
        this.otps = otps;
        this.tickets = tickets;
        this.tokenBlacklist = tokenBlacklist;
        this.mailService = mailService;
        this.otpSecret = config.getOrThrow('OTP_SECRET');
        this.otpTtl = Number(config.get('OTP_TTL_SECONDS') ?? 120);
        this.maxAttempts = Number(config.get('OTP_MAX_ATTEMPTS') ?? 5);
        this.cooldown = Number(config.get('OTP_RESEND_COOLDOWN_SECONDS') ?? 60);
        this.ticketTtl = Number(config.get('RESET_TICKET_TTL_SECONDS') ?? 600);
    }
    async forgotPassword(dto) {
        const emailHash = sha256(dto.email);
        const retryAfterSeconds = await this.otps.acquireCooldown(emailHash, this.cooldown);
        if (retryAfterSeconds > 0) {
            throw new BusinessException(ErrorCode.OTP_RATE_LIMITED, `Vui lòng chờ ${retryAfterSeconds} giây trước khi yêu cầu gửi lại mã OTP`, HttpStatus.TOO_MANY_REQUESTS, { retryAfterSeconds });
        }
        const user = await this.users.findByEmail(dto.email);
        if (user && user.status === UserStatus.ACTIVE) {
            const otp = generateOtp();
            await this.otps.saveOtp(emailHash, this.hashOtp(dto.email, otp), this.otpTtl);
            this.mailService.sendOtpMail(user.email, user.fullName, otp, Math.round(this.otpTtl / 60));
            this.logger.log(`OTP issued userId=${user.id}`);
        }
        return {
            message: 'Nếu email tồn tại, chúng tôi đã gửi mã OTP',
            expiresInSeconds: this.otpTtl,
            resendAfterSeconds: this.cooldown,
        };
    }
    async verifyOtp(dto) {
        const emailHash = sha256(dto.email);
        const storedHash = await this.otps.findOtpHash(emailHash);
        if (!storedHash)
            throw this.otpExpired();
        if (!safeEqualHex(storedHash, this.hashOtp(dto.email, dto.otp))) {
            const result = await this.otps.registerWrongAttempt(emailHash, this.maxAttempts);
            if (result.status === 'missing')
                throw this.otpExpired();
            if (result.status === 'locked') {
                throw new BusinessException(ErrorCode.OTP_TOO_MANY_ATTEMPTS, 'Bạn đã nhập sai quá nhiều lần, vui lòng yêu cầu mã OTP mới', HttpStatus.TOO_MANY_REQUESTS);
            }
            const remaining = this.maxAttempts - result.attempts;
            throw new BusinessException(ErrorCode.OTP_INVALID, 'Mã OTP không đúng', HttpStatus.BAD_REQUEST, { remainingAttempts: remaining });
        }
        if (!(await this.otps.consumeOtp(emailHash)))
            throw this.otpExpired();
        const user = await this.users.findByEmail(dto.email);
        if (!user || user.status !== UserStatus.ACTIVE)
            throw this.otpExpired();
        const resetToken = generateResetToken();
        await this.tickets.save(sha256(resetToken), user.id, this.ticketTtl);
        this.logger.log(`OTP verified userId=${user.id}`);
        return { resetToken, expiresInSeconds: this.ticketTtl };
    }
    async resetPassword(dto) {
        const passwordHash = await hashPassword(dto.newPassword);
        const userId = await this.tickets.consume(sha256(dto.resetToken));
        if (userId === null) {
            throw new BusinessException(ErrorCode.RESET_TOKEN_INVALID, 'Mã đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng');
        }
        const ok = await this.tokenBlacklist.changePasswordAndRevokeAll(userId, passwordHash, BlacklistReason.RESET_PASSWORD);
        if (!ok) {
            throw new BusinessException(ErrorCode.RESET_TOKEN_INVALID, 'Mã đặt lại mật khẩu không hợp lệ');
        }
        this.logger.log(`Password reset completed userId=${userId}`);
        return { message: 'Đặt lại mật khẩu thành công' };
    }
    hashOtp(email, otp) {
        return hmacSha256(this.otpSecret, `${email}:${otp}`);
    }
    otpExpired() {
        return new BusinessException(ErrorCode.OTP_EXPIRED, 'Mã OTP đã hết hạn hoặc chưa được yêu cầu, vui lòng gửi lại mã');
    }
};
PasswordRecoveryService = PasswordRecoveryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UserRepository,
        OtpRepository,
        ResetTicketRepository,
        TokenBlacklistService,
        MailService,
        ConfigService])
], PasswordRecoveryService);
export { PasswordRecoveryService };
//# sourceMappingURL=password-recovery.service.js.map