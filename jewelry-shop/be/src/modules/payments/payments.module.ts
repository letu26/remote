import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { BankTransferSettingsController, PaymentInfoController } from './controllers/payment.controllers.js';
import { PaymentService } from './services/payment.service.js';

@Module({
  imports: [SettingsModule],
  controllers: [PaymentInfoController, BankTransferSettingsController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentsModule {}
