import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { ValidationException } from '../../../exceptions/index.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import {
  AdminOrderListQueryDto,
  CancelOrderDto,
  CreateOrderDto,
  OrderListQueryDto,
  PreviewOrderDto,
  UpdateOrderPaymentDto,
  UpdateOrderStatusDto,
} from '../dtos/order.dtos.js';
import { OrderAdminService } from '../services/order-admin.service.js';
import { OrderService } from '../services/order.service.js';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  preview(@CurrentUser() user: AuthenticatedUser, @Body() dto: PreviewOrderDto) {
    return this.service.preview(user.id, dto);
  }

  /** 201 khi tạo mới, 200 khi trả lại đơn của lần gửi trước cùng Idempotency-Key. */
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: CreateOrderDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!idempotencyKey || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      throw new ValidationException([
        { field: 'Idempotency-Key', message: 'Header Idempotency-Key là bắt buộc (8-100 ký tự chữ, số, gạch)' },
      ]);
    }
    const { order, created } = await this.service.create(user.id, idempotencyKey, dto);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return order;
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: OrderListQueryDto) {
    return this.service.list(user.id, query);
  }

  @Get(':code')
  detail(@CurrentUser() user: AuthenticatedUser, @Param('code') code: string) {
    return this.service.detail(user.id, code);
  }

  @Post(':code/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('code') code: string, @Body() dto: CancelOrderDto) {
    return this.service.cancel(user.id, code, dto);
  }
}

@Controller('admin/orders')
@AdminOnly()
export class OrderAdminController {
  constructor(private readonly service: OrderAdminService) {}

  @Get()
  list(@Query() query: AdminOrderListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(id, admin.id, dto);
  }

  @Patch(':id/payment')
  updatePayment(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderPaymentDto,
  ) {
    return this.service.updatePayment(id, admin.id, dto);
  }
}
