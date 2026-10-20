import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { BankTransferSettingsDto } from '../dtos/bank-transfer.dtos.js';
import { PaymentService } from '../services/payment.service.js';

@Controller('payment-info')
@UseGuards(JwtAuthGuard)
export class PaymentInfoController {
  constructor(private readonly payments: PaymentService) {}

  @Get('bank-transfer')
  bankTransfer() {
    return this.payments.getBankTransferInfo();
  }
}

@Controller('admin/settings/bank-transfer')
@AdminOnly()
export class BankTransferSettingsController {
  constructor(private readonly payments: PaymentService) {}

  @Get()
  get() {
    return this.payments.getBankTransferInfo();
  }

  @Put()
  save(@Body() dto: BankTransferSettingsDto) {
    return this.payments.saveBankTransferInfo(dto);
  }
}
