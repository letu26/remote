import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/services/mail.service.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserRepository } from '../../users/repositories/user.repository.js';
import type { ForgotPasswordDto, ResetPasswordDto, VerifyOtpDto } from '../dtos/auth.dtos.js';
import { OtpRepository } from '../repositories/otp.repository.js';
import { ResetTicketRepository } from '../repositories/reset-ticket.repository.js';
export declare class PasswordRecoveryService {
    private readonly users;
    private readonly otps;
    private readonly tickets;
    private readonly tokenBlacklist;
    private readonly mailService;
    private readonly logger;
    private readonly otpSecret;
    private readonly otpTtl;
    private readonly maxAttempts;
    private readonly cooldown;
    private readonly ticketTtl;
    constructor(users: UserRepository, otps: OtpRepository, tickets: ResetTicketRepository, tokenBlacklist: TokenBlacklistService, mailService: MailService, config: ConfigService);
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
        expiresInSeconds: number;
        resendAfterSeconds: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        resetToken: string;
        expiresInSeconds: number;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    hashOtp(email: string, otp: string): string;
    private otpExpired;
}
