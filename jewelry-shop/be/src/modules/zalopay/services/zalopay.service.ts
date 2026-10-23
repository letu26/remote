import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PublishAfter } from '../../../aspects/publish-after.decorator.js';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../orders/models/order.enums.js';
import type { ZaloPayCallbackDto } from '../dtos/zalopay.dtos.js';
import { ZaloPayTransactionStatus } from '../models/zalopay-transaction.entity.js';
import {
  ZaloPayTransactionRepository,
  type PayableOrderRow,
  type SettleInfo,
  type SettleResult,
  type TransactionRow,
} from '../repositories/zalopay-transaction.repository.js';
import { buildAppTransId, verifyCallbackMac } from '../utils/zalopay-signature.util.js';
import { ZaloPayGateway, type ZaloPayConfig } from './zalopay-gateway.service.js';

/** Đơn hết hạn thanh toán sau 15 phút kể từ lúc tạo mã (quy định của ZaloPay). */
const ORDER_TTL_MS = 15 * 60 * 1000;
/** Còn dưới ngần này thì tạo mã mới thay vì cho khách quét mã sắp hết hạn. */
const MIN_REMAINING_MS = 60 * 1000;
/** Hỏi ZaloPay tối đa một lần mỗi khoảng này cho mỗi giao dịch (fe hỏi trạng thái liên tục). */
const QUERY_MIN_INTERVAL_MS = 3000;
const MAX_CREATE_ATTEMPTS = 2;
const DUPLICATE_APP_TRANS_ID = -68;

export interface ZaloPayPaymentView {
  appTransId: string;
  orderUrl: string;
  amount: number;
  expiresAt: string;
}

export type ZaloPayStatusView =
  | { status: 'paid' }
  | { status: 'none' }
  | { status: 'expired' }
  | { status: 'pending'; expiresAt: string };

export interface ZaloPayCallbackResult {
  return_code: number;
  return_message: string;
}

interface CallbackData {
  app_id?: number | string;
  app_trans_id?: string;
  amount?: number;
  zp_trans_id?: number | string;
  channel?: number;
}

@Injectable()
export class ZaloPayService {
  private readonly logger = new Logger(ZaloPayService.name);
  private readonly lastQueryAt = new Map<string, number>();

  constructor(
    private readonly repository: ZaloPayTransactionRepository,
    private readonly gateway: ZaloPayGateway,
  ) {}

  /** Tạo (hoặc trả lại mã còn hạn) để khách quét bằng app ZaloPay. */
  async createPayment(userId: number, orderCode: string): Promise<ZaloPayPaymentView> {
    const cfg = this.requireConfig();
    const order = await this.requirePayableOrder(userId, orderCode);

    const latest = await this.repository.findLatestByOrderId(order.id);
    if (latest?.status === ZaloPayTransactionStatus.PENDING && latest.expiresAt.getTime() - Date.now() > MIN_REMAINING_MS) {
      return this.toView(latest);
    }

    let attempt = (await this.repository.countByOrderId(order.id)) + 1;
    for (let i = 0; i < MAX_CREATE_ATTEMPTS; i += 1, attempt += 1) {
      const now = new Date();
      const appTransId = buildAppTransId(order.code, attempt, now);
      const result = await this.callGateway(() =>
        this.gateway.createOrder(cfg, {
          appTransId,
          appUser: `user${order.userId}`,
          amount: order.total,
          description: `Thanh toan don hang ${order.code}`.slice(0, 100),
          embedData: JSON.stringify(cfg.redirectUrl ? { redirecturl: cfg.redirectUrl } : {}),
          item: JSON.stringify([{ itemid: order.code, itemname: `Don hang ${order.code}`, itemprice: order.total, itemquantity: 1 }]),
        }),
      );
      if (result.returnCode === 1 && result.orderUrl) {
        const expiresAt = new Date(now.getTime() + ORDER_TTL_MS);
        await this.repository.insert({ orderId: order.id, appTransId, amount: order.total, orderUrl: result.orderUrl, expiresAt });
        return { appTransId, orderUrl: result.orderUrl, amount: order.total, expiresAt: expiresAt.toISOString() };
      }
      // Trùng app_trans_id (đã có người dùng cùng app_id): đổi "lần thử" rồi tạo lại.
      if (result.subReturnCode === DUPLICATE_APP_TRANS_ID) continue;
      this.logger.warn(`ZaloPay create failed: code=${result.returnCode} sub=${result.subReturnCode} ${result.message}`);
      throw new BusinessException(
        ErrorCode.PAYMENT_GATEWAY_ERROR,
        'ZaloPay chưa tạo được mã thanh toán, vui lòng thử lại sau',
        HttpStatus.BAD_GATEWAY,
      );
    }
    throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, 'Không tạo được mã thanh toán, vui lòng thử lại', HttpStatus.BAD_GATEWAY);
  }

  /**
   * Trạng thái thanh toán của đơn. Callback là nguồn chính; ở đây còn chủ động hỏi ZaloPay cho trường hợp
   * mất callback (tài liệu khuyến nghị). Lỗi khi hỏi chỉ ghi log, coi như chưa có kết quả.
   */
  async getStatus(userId: number, orderCode: string): Promise<ZaloPayStatusView> {
    const order = await this.repository.findOrderOfUser(orderCode, userId);
    if (!order) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy đơn hàng', HttpStatus.NOT_FOUND);
    if (order.paymentStatus === PaymentStatus.PAID) return { status: 'paid' };

    const latest = await this.repository.findLatestByOrderId(order.id);
    if (!latest) return { status: 'none' };
    if (latest.status === ZaloPayTransactionStatus.PAID) return { status: 'paid' };
    if (latest.status === ZaloPayTransactionStatus.FAILED) return { status: 'expired' };

    const cfg = this.gateway.getConfig();
    if (cfg && this.canQueryNow(latest.appTransId)) {
      try {
        const result = await this.gateway.queryOrder(cfg, latest.appTransId);
        if (result.returnCode === 1) {
          await this.settlePayment(
            latest.appTransId,
            { zpTransId: result.zpTransId, channel: null, callbackData: null },
            'ZaloPay: đã nhận thanh toán (xác nhận qua truy vấn)',
          );
          return { status: 'paid' };
        }
      } catch (error) {
        this.logger.warn(`ZaloPay query failed: ${(error as Error).message}`);
      }
    }
    if (latest.expiresAt.getTime() <= Date.now()) {
      await this.repository.markFailed(latest.appTransId);
      this.lastQueryAt.delete(latest.appTransId);
      return { status: 'expired' };
    }
    return { status: 'pending', expiresAt: latest.expiresAt.toISOString() };
  }

  /** Xử lý callback từ ZaloPay. Luôn trả JSON đúng định dạng ZaloPay yêu cầu (HTTP 200). */
  async handleCallback(dto: ZaloPayCallbackDto): Promise<ZaloPayCallbackResult> {
    const cfg = this.gateway.getConfig();
    if (!cfg) return { return_code: 0, return_message: 'payment not configured' };
    if (!verifyCallbackMac(dto.data, dto.mac, cfg.key2)) return { return_code: -1, return_message: 'mac not equal' };

    try {
      const data = JSON.parse(dto.data) as CallbackData;
      const appTransId = data.app_trans_id;
      if (!appTransId || String(data.app_id) !== cfg.appId) return { return_code: 2, return_message: 'invalid callback data' };

      const transaction = await this.repository.findByAppTransId(appTransId);
      if (!transaction) {
        this.logger.warn(`ZaloPay callback for unknown transaction ${appTransId}`);
        return { return_code: 2, return_message: 'unknown transaction' };
      }
      if (typeof data.amount !== 'number' || data.amount !== transaction.amount) {
        this.logger.error(`ZaloPay callback amount mismatch for ${appTransId}: ${data.amount} vs ${transaction.amount}`);
        return { return_code: 2, return_message: 'amount mismatch' };
      }
      const { outcome } = await this.settlePayment(
        appTransId,
        {
          zpTransId: data.zp_trans_id !== undefined ? String(data.zp_trans_id) : null,
          channel: typeof data.channel === 'number' ? data.channel : null,
          callbackData: dto.data.slice(0, 5000),
        },
        'ZaloPay: đã nhận thanh toán',
      );
      this.lastQueryAt.delete(appTransId);
      if (outcome === 'not_found') return { return_code: 2, return_message: 'unknown transaction' };
      return { return_code: 1, return_message: 'success' };
    } catch (error) {
      // return_code 0: ZaloPay gọi lại (tối đa 3 lần).
      this.logger.error(`ZaloPay callback error: ${(error as Error).message}`);
      return { return_code: 0, return_message: 'internal error' };
    }
  }

  /**
   * Ghi nhận thanh toán thành công. Aspect @PublishAfter phát "order.paid" đúng một lần cho lần ghi nhận đầu tiên
   * (callback trùng trả 'already_paid' thì không phát); việc gửi email nằm ở NotificationsModule.
   */
  @PublishAfter('order.paid', (result: SettleResult) => (result.outcome === 'settled' && result.orderId !== null ? { orderId: result.orderId } : null))
  private settlePayment(appTransId: string, info: SettleInfo, historyNote: string): Promise<SettleResult> {
    return this.repository.settle(appTransId, info, historyNote);
  }

  private requireConfig(): ZaloPayConfig {
    const cfg = this.gateway.getConfig();
    if (!cfg) {
      throw new BusinessException(ErrorCode.PAYMENT_NOT_AVAILABLE, 'Thanh toán ZaloPay chưa được cấu hình', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return cfg;
  }

  private async requirePayableOrder(userId: number, orderCode: string): Promise<PayableOrderRow> {
    const order = await this.repository.findOrderOfUser(orderCode, userId);
    if (!order) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy đơn hàng', HttpStatus.NOT_FOUND);
    if (order.paymentMethod !== PaymentMethod.ZALOPAY) {
      throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 'Đơn này không thanh toán bằng ZaloPay', HttpStatus.CONFLICT);
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 'Đơn hàng đã được thanh toán', HttpStatus.CONFLICT);
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 'Đơn hàng đã bị hủy', HttpStatus.CONFLICT);
    }
    return order;
  }

  private async callGateway<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      this.logger.error(`ZaloPay request failed: ${(error as Error).message}`);
      throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR, 'Không kết nối được ZaloPay, vui lòng thử lại', HttpStatus.BAD_GATEWAY);
    }
  }

  private canQueryNow(appTransId: string): boolean {
    const last = this.lastQueryAt.get(appTransId) ?? 0;
    if (Date.now() - last < QUERY_MIN_INTERVAL_MS) return false;
    this.lastQueryAt.set(appTransId, Date.now());
    return true;
  }

  private toView(row: TransactionRow): ZaloPayPaymentView {
    return { appTransId: row.appTransId, orderUrl: row.orderUrl, amount: row.amount, expiresAt: row.expiresAt.toISOString() };
  }
}
