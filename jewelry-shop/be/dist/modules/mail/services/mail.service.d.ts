import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly config;
    private readonly logger;
    private transporter?;
    constructor(config: ConfigService);
    sendOtpMail(to: string, fullName: string, otp: string, expiresMinutes: number): void;
    private getTransporter;
}
