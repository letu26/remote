import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module.js';
import { OrderMailListener } from './listeners/order-mail.listener.js';
import { NotificationRepository } from './repositories/notification.repository.js';

@Module({
  imports: [MailModule],
  providers: [NotificationRepository, OrderMailListener],
})
export class NotificationsModule {}
