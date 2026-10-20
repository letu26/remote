import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import {
  generateOtp,
  generateResetToken,
  hashPassword,
  hmacSha256,
  safeEqualHex,
  sha256,
} from '../../../utils/crypto.util.js';
import { MailService } from '../../mail/services/mail.service.js';
import { BlacklistReason } from '../../token-blacklist/models/token-blacklist.entity.js';
import { TokenBlacklistService } from '../../token-blacklist/services/token-blacklist.service.js';
import { UserStatus } from '../../users/models/user.entity.js';
import { UserRepository } from '../../users/repositories/user.repository.js';
import type { ForgotPasswordDto, ResetPasswordDto, VerifyOtpDto } from '../dtos/auth.dtos.js';
import { OtpRepository } from '../repositories/otp.repository.js';
import { ResetTicketRepository } from '../repositories/reset-ticket.repository.js';

/** Luồng quên mật khẩu 3 bước: gửi OTP -> xác thực OTP -> đặt mật khẩu mới. */
@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name);
  private readonly otpSecret: string;
  private readonly otpTtl: number;
  private readonly maxAttempts: number;
  private readonly cooldown: number;
  private readonly ticketTtl: number;

  constructor(
    private readonly users: UserRepository,
    private readonly otps: OtpRepository,
    private readonly tickets: ResetTicketRepository,
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly mailService: MailService,
    config: ConfigService,
  ) {
    this.otpSecret = config.getOrThrow<string>('OTP_SECRET');
    this.otpTtl = Number(config.get<string>('OTP_TTL_SECONDS') ?? 120);
    this.maxAttempts = Number(config.get<string>('OTP_MAX_ATTEMPTS') ?? 5);
    this.cooldown = Number(config.get<string>('OTP_RESEND_COOLDOWN_SECONDS') ?? 60);
    this.ticketTtl = Number(config.get<string>('RESET_TICKET_TTL_SECONDS') ?? 600);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const emailHash = sha256(dto.email);
    // Cooldown áp dụng cho mọi email để hành vi không lộ email có tồn tại hay không.
    const retryAfterSeconds = await this.otps.acquireCooldown(emailHash, this.cooldown);
    if (retryAfterSeconds > 0) {
      throw new BusinessException(
        ErrorCode.OTP_RATE_LIMITED,
        `Vui lòng chờ ${retryAfterSeconds} giây trước khi yêu cầu gửi lại mã OTP`,
        HttpStatus.TOO_MANY_REQUESTS,
        { retryAfterSeconds },
      );
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

  async verifyOtp(dto: VerifyOtpDto) {
    const emailHash = sha256(dto.email);
    const storedHash = await this.otps.findOtpHash(emailHash);
    if (!storedHash) throw this.otpExpired();

    if (!safeEqualHex(storedHash, this.hashOtp(dto.email, dto.otp))) {
      const result = await this.otps.registerWrongAttempt(emailHash, this.maxAttempts);
      if (result.status === 'missing') throw this.otpExpired();
      if (result.status === 'locked') {
        throw new BusinessException(
          ErrorCode.OTP_TOO_MANY_ATTEMPTS,
          'Bạn đã nhập sai quá nhiều lần, vui lòng yêu cầu mã OTP mới',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      const remaining = this.maxAttempts - result.attempts;
      throw new BusinessException(
        ErrorCode.OTP_INVALID,
        'Mã OTP không đúng',
        HttpStatus.BAD_REQUEST,
        { remainingAttempts: remaining },
      );
    }

    // Chỉ một request đúng OTP được phép đổi sang resetToken.
    if (!(await this.otps.consumeOtp(emailHash))) throw this.otpExpired();
    const user = await this.users.findByEmail(dto.email);
    if (!user || user.status !== UserStatus.ACTIVE) throw this.otpExpired();

    const resetToken = generateResetToken();
    await this.tickets.save(sha256(resetToken), user.id, this.ticketTtl);
    this.logger.log(`OTP verified userId=${user.id}`);
    return { resetToken, expiresInSeconds: this.ticketTtl };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const passwordHash = await hashPassword(dto.newPassword);
    const userId = await this.tickets.consume(sha256(dto.resetToken));
    if (userId === null) {
      throw new BusinessException(
        ErrorCode.RESET_TOKEN_INVALID,
        'Mã đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng',
      );
    }
    const ok = await this.tokenBlacklist.changePasswordAndRevokeAll(userId, passwordHash, BlacklistReason.RESET_PASSWORD);
    if (!ok) {
      throw new BusinessException(ErrorCode.RESET_TOKEN_INVALID, 'Mã đặt lại mật khẩu không hợp lệ');
    }
    this.logger.log(`Password reset completed userId=${userId}`);
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  /** HMAC-SHA256(OTP_SECRET, email:otp). Public để kiểm thử nạp OTP đã biết vào Redis. */
  hashOtp(email: string, otp: string): string {
    return hmacSha256(this.otpSecret, `${email}:${otp}`);
  }

  private otpExpired() {
    return new BusinessException(ErrorCode.OTP_EXPIRED, 'Mã OTP đã hết hạn hoặc chưa được yêu cầu, vui lòng gửi lại mã');
  }
}
