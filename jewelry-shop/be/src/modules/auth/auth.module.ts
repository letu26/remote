import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module.js';
import { UsersModule } from '../users/users.module.js';
import { OtpRepository } from './repositories/otp.repository.js';
import { ResetTicketRepository } from './repositories/reset-ticket.repository.js';
import { PasswordRecoveryService } from './services/password-recovery.service.js';
import { AuthController } from './controllers/auth.controller.js';
import { AuthService } from './services/auth.service.js';

/** Global để các guard (JwtAuthGuard) ở module khác inject được JwtService. */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '1d' } as never,
      }),
    }),
    UsersModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordRecoveryService, OtpRepository, ResetTicketRepository],
  exports: [JwtModule],
})
export class AuthModule {}
