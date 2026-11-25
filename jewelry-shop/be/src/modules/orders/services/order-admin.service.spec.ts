import { describe, expect, it, vi } from 'vitest';
import type { PaymentService } from '../../payments/services/payment.service.js';
import { OrderStatus, PaymentStatus } from '../models/order.enums.js';
import type { OrderQueryRepository } from '../repositories/order-query.repository.js';
import type { OrderRepository } from '../repositories/order.repository.js';
import { OrderAdminService } from './order-admin.service.js';
import type { OrderViewService } from './order-view.service.js';

async function confirmPayment(from: OrderStatus, paymentStatus: PaymentStatus) {
  const tx = { order: { status: from }, update: vi.fn(), addHistory: vi.fn() };
  const service = new OrderAdminService(
    { withLockedOrder: (_where: unknown, work: (t: unknown) => unknown) => work(tx) } as unknown as OrderRepository,
    {} as OrderQueryRepository,
    { assertManualPaymentAllowed: vi.fn() } as unknown as PaymentService,
    {} as OrderViewService,
  );
  vi.spyOn(service, 'detail').mockResolvedValue({} as never);
  await service.updatePayment(1, 9, { paymentStatus });
  return { status: tx.update.mock.calls[0][0].status, history: tx.addHistory.mock.calls[0][0] };
}

describe('OrderAdminService.updatePayment', () => {
  it.each([
    ['đơn đang chờ, đã nhận tiền: tự duyệt', OrderStatus.PENDING, PaymentStatus.PAID, OrderStatus.CONFIRMED],
    ['đơn đang giao, đã nhận tiền: giữ trạng thái', OrderStatus.SHIPPING, PaymentStatus.PAID, OrderStatus.SHIPPING],
    ['bỏ xác nhận: không đổi trạng thái', OrderStatus.CONFIRMED, PaymentStatus.UNPAID, OrderStatus.CONFIRMED],
  ])('%s', async (_name, from, payment, expected) => {
    expect(await confirmPayment(from, payment)).toEqual({ status: expected, history: expected });
  });
});
