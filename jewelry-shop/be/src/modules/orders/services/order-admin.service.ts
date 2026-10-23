import { PublishAfter } from '../../../aspects/publish-after.decorator.js';
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { startOfVietnamDay } from '../../../utils/order-code.util.js';
import { type Page, resolvePage, toPage } from '../../../utils/pagination.js';
import { PaymentService } from '../../payments/services/payment.service.js';
import type { AdminOrderListQueryDto, UpdateOrderPaymentDto, UpdateOrderStatusDto } from '../dtos/order.dtos.js';
import { OrderStatus, PaymentStatus } from '../models/order.enums.js';
import { OrderQueryRepository } from '../repositories/order-query.repository.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { isValidAdminTransition } from './order-status.rules.js';
import { OrderViewService } from './order-view.service.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OrderAdminService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly queries: OrderQueryRepository,
    private readonly payments: PaymentService,
    private readonly views: OrderViewService,
  ) {}

  async list(query: AdminOrderListQueryDto): Promise<Page<unknown>> {
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const { rows, total } = await this.queries.findAdminPage(
      {
        q: query.q || undefined,
        status: query.status,
        paymentStatus: query.paymentStatus,
        userId: query.userId,
        from: query.from ? startOfVietnamDay(query.from) : undefined,
        toExclusive: query.to ? new Date(startOfVietnamDay(query.to).getTime() + DAY_MS) : undefined,
      },
      request.pageSize,
      request.offset,
    );
    const previews = await this.queries.findItemPreviews(
      rows.map((row) => row.id),
      0,
    );
    const items = rows.map((row) => ({
      id: row.id,
      code: row.code,
      createdAt: row.createdAt,
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone,
      status: row.status,
      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus,
      total: row.total,
      itemCount: previews.get(row.id)?.itemCount ?? 0,
    }));
    return toPage(items, total, request);
  }

  async detail(id: number) {
    const order = await this.queries.findById(id);
    if (!order) throw this.views.notFound();
    return this.views.adminDetail(order);
  }

  /** Aspect: khi admin chuyển đơn sang "Giao hàng thành công" (bước cuối) thì phát "order.delivered" để gửi email cho khách. */
  @PublishAfter('order.delivered', (_result: unknown, args: unknown[]) =>
    (args[2] as UpdateOrderStatusDto).status === OrderStatus.DELIVERED ? { orderId: args[0] as number } : null,
  )
  async updateStatus(id: number, adminId: number, dto: UpdateOrderStatusDto) {
    const note = dto.note?.trim() || null;
    const outcome = await this.orders.withLockedOrder({ id }, async (tx) => {
      const from = tx.order.status;
      if (!isValidAdminTransition(from, dto.status)) return { invalid: from };

      if (dto.status === OrderStatus.CANCELLED) {
        await tx.update({ status: OrderStatus.CANCELLED, cancelReason: note });
        await tx.restockItems();
      } else if (dto.status === OrderStatus.DELIVERED) {
        const settlement = this.payments.settlementOnDelivery(tx.order.paymentMethod);
        await tx.update({ status: OrderStatus.DELIVERED, ...settlement });
        await tx.increaseSoldCount();
      } else {
        await tx.update({ status: dto.status });
      }
      await tx.addHistory(dto.status, adminId, note);
      return { invalid: null };
    });
    if (outcome === null) throw this.views.notFound();
    if (outcome.invalid) {
      throw new BusinessException(
        ErrorCode.INVALID_STATUS_TRANSITION,
        `Không thể chuyển đơn từ "${outcome.invalid}" sang "${dto.status}"`,
        HttpStatus.CONFLICT,
      );
    }
    return this.detail(id);
  }

  async updatePayment(id: number, adminId: number, dto: UpdateOrderPaymentDto) {
    const outcome = await this.orders.withLockedOrder({ id }, async (tx) => {
      this.payments.assertManualPaymentAllowed(tx.order);
      const paid = dto.paymentStatus === PaymentStatus.PAID;
      await tx.update({ paymentStatus: dto.paymentStatus, paidAt: paid ? new Date() : null });
      const label = paid ? 'Xác nhận đã nhận thanh toán' : 'Hủy xác nhận thanh toán';
      await tx.addHistory(tx.order.status, adminId, dto.note?.trim() ? `${label}: ${dto.note.trim()}` : label);
      return true;
    });
    if (outcome === null) throw this.views.notFound();
    return this.detail(id);
  }
}
