import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  /** Gửi OTP bất đồng bộ (không await ở nơi gọi); lỗi chỉ ghi log, không log OTP. */
  sendOtpMail(to: string, fullName: string, otp: string, expiresMinutes: number): void {
    const html = `<p>Xin chào ${escapeHtml(fullName)},</p>
<p>Mã OTP đặt lại mật khẩu của bạn là:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${otp}</p>
<p>Mã có hiệu lực trong ${expiresMinutes} phút. Vui lòng không chia sẻ mã này cho bất kỳ ai. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`;
    const text = `Xin chào ${fullName},\n\nMã OTP đặt lại mật khẩu của bạn là: ${otp}\nMã có hiệu lực trong ${expiresMinutes} phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`;

    this.getTransporter()
      .sendMail({
        from: this.config.get<string>('MAIL_FROM') ?? this.config.get<string>('MAIL_USER'),
        to,
        subject: 'Mã OTP đặt lại mật khẩu',
        text,
        html,
      })
      .then(() => this.logger.log('OTP mail sent'))
      .catch((error: unknown) => this.logger.error(`Send OTP mail failed: ${(error as Error)?.message}`));
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const port = Number(this.config.get<string>('MAIL_PORT') ?? 587);
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('MAIL_HOST'),
        port,
        secure: port === 465,
        auth: { user: this.config.get<string>('MAIL_USER'), pass: this.config.get<string>('MAIL_PASSWORD') },
      });
    }
    return this.transporter;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}
