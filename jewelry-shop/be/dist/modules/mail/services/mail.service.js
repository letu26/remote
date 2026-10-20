var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
let MailService = MailService_1 = class MailService {
    config;
    logger = new Logger(MailService_1.name);
    transporter;
    constructor(config) {
        this.config = config;
    }
    sendOtpMail(to, fullName, otp, expiresMinutes) {
        const html = `<p>Xin chào ${escapeHtml(fullName)},</p>
<p>Mã OTP đặt lại mật khẩu của bạn là:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${otp}</p>
<p>Mã có hiệu lực trong ${expiresMinutes} phút. Vui lòng không chia sẻ mã này cho bất kỳ ai. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`;
        const text = `Xin chào ${fullName},\n\nMã OTP đặt lại mật khẩu của bạn là: ${otp}\nMã có hiệu lực trong ${expiresMinutes} phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`;
        this.getTransporter()
            .sendMail({
            from: this.config.get('MAIL_FROM') ?? this.config.get('MAIL_USER'),
            to,
            subject: 'Mã OTP đặt lại mật khẩu',
            text,
            html,
        })
            .then(() => this.logger.log('OTP mail sent'))
            .catch((error) => this.logger.error(`Send OTP mail failed: ${error?.message}`));
    }
    getTransporter() {
        if (!this.transporter) {
            const port = Number(this.config.get('MAIL_PORT') ?? 587);
            this.transporter = nodemailer.createTransport({
                host: this.config.get('MAIL_HOST'),
                port,
                secure: port === 465,
                auth: { user: this.config.get('MAIL_USER'), pass: this.config.get('MAIL_PASSWORD') },
            });
        }
        return this.transporter;
    }
};
MailService = MailService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], MailService);
export { MailService };
function escapeHtml(value) {
    return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
//# sourceMappingURL=mail.service.js.map