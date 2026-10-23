import { afterEach, describe, expect, it, vi } from 'vitest';
import { domainEvents } from '../../../aspects/domain-events.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../orders/models/order.enums.js';
import { ZaloPayTransactionStatus } from '../models/zalopay-transaction.entity.js';
import type { PayableOrderRow, TransactionRow, ZaloPayTransactionRepository } from '../repositories/zalopay-transaction.repository.js';
import { hmacSha256 } from '../utils/zalopay-signature.util.js';
import type { ZaloPayConfig, ZaloPayGateway } from './zalopay-gateway.service.js';
import { ZaloPayService } from './zalopay.service.js';

const cfg: ZaloPayConfig = { appId: '2554', key1: 'k1', key2: 'k2', endpoint: 'https://x/v2/', callbackUrl: 'https://cb', redirectUrl: '' };

const order: PayableOrderRow = {
  id: 10,
  code: 'LG20261023-123456',
  userId: 7,
  total: 5_832_000,
  status: OrderStatus.PENDING,
  paymentMethod: PaymentMethod.ZALOPAY,
  paymentStatus: PaymentStatus.UNPAID,
};
const pendingTx: TransactionRow = {
  id: 1,
  orderId: 10,
  appTransId: '261023_LG20261023-123456_1',
  amount: 5_832_000,
  status: ZaloPayTransactionStatus.PENDING,
  orderUrl: 'https://sbgateway.zalopay.vn/openinapp?order=abc',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  createdAt: new Date(),
};

function build(repo: Partial<Record<keyof ZaloPayTransactionRepository, unknown>> = {}, gateway: Partial<Record<keyof ZaloPayGateway, unknown>> = {}) {
  const repository = {
    findOrderOfUser: vi.fn().mockResolvedValue(order),
    findLatestByOrderId: vi.fn().mockResolvedValue(null),
    findByAppTransId: vi.fn().mockResolvedValue(pendingTx),
    countByOrderId: vi.fn().mockResolvedValue(0),
    insert: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
    settle: vi.fn().mockResolvedValue({ outcome: 'settled', orderId: 10 }),
    ...repo,
  };
  const gw = {
    getConfig: vi.fn().mockReturnValue(cfg),
    createOrder: vi.fn().mockResolvedValue({ returnCode: 1, subReturnCode: 1, message: '', orderUrl: 'https://sbgateway.zalopay.vn/openinapp?order=new' }),
    queryOrder: vi.fn().mockResolvedValue({ returnCode: 3, isProcessing: true, zpTransId: null, amount: null }),
    ...gateway,
  };
  return { service: new ZaloPayService(repository as never, gw as never), repository, gw };
}

const callbackBody = (data: object, key = 'k2') => {
  const text = JSON.stringify(data);
  return { data: text, mac: hmacSha256(key, text) };
};

const unsubscribers: (() => void)[] = [];
afterEach(() => unsubscribers.splice(0).forEach((off) => off()));

describe('ZaloPayService.handleCallback', () => {
  const valid = { app_id: 2554, app_trans_id: pendingTx.appTransId, amount: 5_832_000, zp_trans_id: 999, channel: 38 };

  it('sai chữ ký -> return_code -1 và không ghi gì', async () => {
    const { service, repository } = build();
    const result = await service.handleCallback(callbackBody(valid, 'sai-khoa'));
    expect(result.return_code).toBe(-1);
    expect(repository.settle).not.toHaveBeenCalled();
  });

  it('hợp lệ -> ghi nhận thanh toán và trả return_code 1', async () => {
    const { service, repository } = build();
    expect((await service.handleCallback(callbackBody(valid))).return_code).toBe(1);
    expect(repository.settle).toHaveBeenCalledOnce();
  });

  it('callback trùng (đã thanh toán) vẫn trả 1, không lỗi', async () => {
    const { service } = build({ settle: vi.fn().mockResolvedValue({ outcome: 'already_paid', orderId: 10 }) });
    expect((await service.handleCallback(callbackBody(valid))).return_code).toBe(1);
  });

  it('số tiền không khớp giao dịch -> từ chối, không ghi', async () => {
    const { service, repository } = build();
    expect((await service.handleCallback(callbackBody({ ...valid, amount: 1 }))).return_code).toBe(2);
    expect(repository.settle).not.toHaveBeenCalled();
  });

  it('giao dịch lạ -> return_code 2', async () => {
    const { service } = build({ findByAppTransId: vi.fn().mockResolvedValue(null) });
    expect((await service.handleCallback(callbackBody(valid))).return_code).toBe(2);
  });

  it('app_id khác -> từ chối', async () => {
    const { service } = build();
    expect((await service.handleCallback(callbackBody({ ...valid, app_id: 1 }))).return_code).toBe(2);
  });

  it('ghi nhận lần đầu -> phát sự kiện order.paid đúng một lần với mã đơn', async () => {
    const handler = vi.fn();
    unsubscribers.push(domainEvents.subscribe('order.paid', handler));
    const { service } = build();
    await service.handleCallback(callbackBody(valid));
    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce());
    expect(handler).toHaveBeenCalledWith({ orderId: 10 });
  });

  it('callback trùng (đã thanh toán) -> không phát sự kiện lần nữa', async () => {
    const handler = vi.fn();
    unsubscribers.push(domainEvents.subscribe('order.paid', handler));
    const { service } = build({ settle: vi.fn().mockResolvedValue({ outcome: 'already_paid', orderId: 10 }) });
    await service.handleCallback(callbackBody(valid));
    await new Promise((r) => setTimeout(r, 20));
    expect(handler).not.toHaveBeenCalled();
  });

  it('người nghe sự kiện lỗi không làm hỏng việc ghi nhận (vẫn trả 1)', async () => {
    unsubscribers.push(
      domainEvents.subscribe('order.paid', async () => {
        throw new Error('gửi mail lỗi');
      }),
    );
    const { service } = build();
    expect((await service.handleCallback(callbackBody(valid))).return_code).toBe(1);
    await new Promise((r) => setTimeout(r, 20));
  });

  it('lỗi DB tạm thời -> return_code 0 để ZaloPay gọi lại', async () => {
    const { service } = build({ settle: vi.fn().mockRejectedValue(new Error('db down')) });
    expect((await service.handleCallback(callbackBody(valid))).return_code).toBe(0);
  });
});

describe('ZaloPayService.createPayment', () => {
  it('đơn chưa có mã -> gọi ZaloPay và lưu giao dịch', async () => {
    const { service, repository, gw } = build();
    const view = await service.createPayment(7, order.code);
    expect(gw.createOrder).toHaveBeenCalledOnce();
    expect(repository.insert).toHaveBeenCalledOnce();
    expect(view.orderUrl).toContain('order=new');
    expect(view.amount).toBe(order.total);
  });

  it('còn mã chưa hết hạn -> trả lại mã cũ, không gọi ZaloPay', async () => {
    const { service, gw } = build({ findLatestByOrderId: vi.fn().mockResolvedValue(pendingTx) });
    expect((await service.createPayment(7, order.code)).appTransId).toBe(pendingTx.appTransId);
    expect(gw.createOrder).not.toHaveBeenCalled();
  });

  it('đơn không phải ZaloPay, đã thanh toán hoặc đã hủy -> 409', async () => {
    for (const patch of [{ paymentMethod: PaymentMethod.COD }, { paymentStatus: PaymentStatus.PAID }, { status: OrderStatus.CANCELLED }]) {
      const { service } = build({ findOrderOfUser: vi.fn().mockResolvedValue({ ...order, ...patch }) });
      await expect(service.createPayment(7, order.code)).rejects.toMatchObject({ status: 409 });
    }
  });

  it('chưa cấu hình khóa -> 503', async () => {
    const { service } = build({}, { getConfig: vi.fn().mockReturnValue(null) });
    await expect(service.createPayment(7, order.code)).rejects.toMatchObject({ status: 503 });
  });

  it('ZaloPay báo lỗi -> 502 và không lưu giao dịch', async () => {
    const { service, repository } = build({}, { createOrder: vi.fn().mockResolvedValue({ returnCode: 2, subReturnCode: -402, message: 'bad', orderUrl: null }) });
    await expect(service.createPayment(7, order.code)).rejects.toMatchObject({ status: 502 });
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('trùng app_trans_id (-68) -> thử lại với lần thử khác', async () => {
    const createOrder = vi
      .fn()
      .mockResolvedValueOnce({ returnCode: 2, subReturnCode: -68, message: 'dup', orderUrl: null })
      .mockResolvedValueOnce({ returnCode: 1, subReturnCode: 1, message: '', orderUrl: 'https://x/ok' });
    const { service, repository } = build({}, { createOrder });
    await service.createPayment(7, order.code);
    expect(createOrder).toHaveBeenCalledTimes(2);
    expect(repository.insert).toHaveBeenCalledOnce();
    expect(createOrder.mock.calls[0]?.[1].appTransId).not.toBe(createOrder.mock.calls[1]?.[1].appTransId);
  });
});

describe('ZaloPayService.getStatus', () => {
  it('đã thanh toán -> paid', async () => {
    const { service } = build({ findOrderOfUser: vi.fn().mockResolvedValue({ ...order, paymentStatus: PaymentStatus.PAID }) });
    expect(await service.getStatus(7, order.code)).toEqual({ status: 'paid' });
  });

  it('ZaloPay báo thành công khi hỏi -> ghi nhận, phát sự kiện và trả paid', async () => {
    const handler = vi.fn();
    unsubscribers.push(domainEvents.subscribe('order.paid', handler));
    const { service, repository } = build(
      { findLatestByOrderId: vi.fn().mockResolvedValue(pendingTx) },
      { queryOrder: vi.fn().mockResolvedValue({ returnCode: 1, isProcessing: false, zpTransId: '55', amount: 5_832_000 }) },
    );
    expect(await service.getStatus(7, order.code)).toEqual({ status: 'paid' });
    expect(repository.settle).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce());
  });

  it('quá hạn mà chưa trả -> đánh dấu thất bại và trả expired', async () => {
    const expired = { ...pendingTx, appTransId: 'het-han', expiresAt: new Date(Date.now() - 1000) };
    const { service, repository } = build({ findLatestByOrderId: vi.fn().mockResolvedValue(expired) });
    expect(await service.getStatus(7, order.code)).toEqual({ status: 'expired' });
    expect(repository.markFailed).toHaveBeenCalledWith('het-han');
  });

  it('lỗi khi hỏi ZaloPay -> vẫn pending, không ném lỗi', async () => {
    const { service } = build(
      { findLatestByOrderId: vi.fn().mockResolvedValue({ ...pendingTx, appTransId: 'loi-mang' }) },
      { queryOrder: vi.fn().mockRejectedValue(new Error('timeout')) },
    );
    expect((await service.getStatus(7, order.code)).status).toBe('pending');
  });
});
