import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { ZaloPayCallbackDto } from '../dtos/zalopay.dtos.js';
import { ZaloPayService } from '../services/zalopay.service.js';

/** Khách tạo mã QR và xem trạng thái thanh toán đơn của chính mình. */
@Controller('payments/zalopay/orders')
@UseGuards(JwtAuthGuard)
export class ZaloPayOrderController {
  constructor(private readonly service: ZaloPayService) {}

  @Post(':code')
  @HttpCode(HttpStatus.OK)
  create(@CurrentUser() user: AuthenticatedUser, @Param('code') code: string) {
    return this.service.createPayment(user.id, code);
  }

  @Get(':code/status')
  status(@CurrentUser() user: AuthenticatedUser, @Param('code') code: string) {
    return this.service.getStatus(user.id, code);
  }
}

/** ZaloPay gọi vào đây (không có JWT): xác thực bằng chữ ký key2 trong service. */
@Controller('payments/zalopay')
export class ZaloPayCallbackController {
  constructor(private readonly service: ZaloPayService) {}

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  callback(@Body() dto: ZaloPayCallbackDto) {
    return this.service.handleCallback(dto);
  }
}
