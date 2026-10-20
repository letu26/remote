import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { PaymentService } from '../../payments/services/payment.service.js';
import { OrderQueryRepository, type OrderRow } from '../repositories/order-query.repository.js';

/** Dựng response chi tiết đơn (khách / admin) từ dữ liệu đã đọc. */
@Injectable()
export class OrderViewService {
  constructor(
    private readonly queries: OrderQueryRepository,
    private readonly payments: PaymentService,
  ) {}

  async customerDetail(order: OrderRow) {
    const [items, history, paymentInstructions] = await Promise.all([
      this.queries.findItems(order.id),
      this.queries.findHistory(order.id),
      this.payments.buildInstructions(order),
    ]);
    return {
      ...this.base(order),
      items,
      history: history.map(({ status, note, createdAt }) => ({ status, note, createdAt })),
      paymentInstructions,
    };
  }

  async adminDetail(order: OrderRow) {
    const [items, history, customer] = await Promise.all([
      this.queries.findItems(order.id),
      this.queries.findHistory(order.id),
      this.queries.findCustomer(order.userId),
    ]);
    return {
      id: order.id,
      ...this.base(order),
      customer,
      items,
      history: history.map(({ status, note, createdAt, changedByName }) => ({
        status,
        note,
        createdAt,
        changedByName: changedByName ?? 'Hệ thống',
      })),
    };
  }

  notFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy đơn hàng', HttpStatus.NOT_FOUND);
  }

  private base(order: OrderRow) {
    return {
      code: order.code,
      createdAt: order.createdAt,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paidAt: order.paidAt,
      cancelReason: order.cancelReason,
      note: order.note,
      receiver: {
        name: order.receiverName,
        phone: order.receiverPhone,
        province: order.provinceName,
        ward: order.wardName,
        addressDetail: order.addressDetail,
      },
      shippingMethodName: order.shippingMethodName,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
    };
  }
}
