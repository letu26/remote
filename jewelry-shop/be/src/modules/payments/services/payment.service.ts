import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../orders/models/order.enums.js';
import { SettingsRepository } from '../../settings/repositories/settings.repository.js';
import { BankTransferSettingsDto, ORDER_CODE_PLACEHOLDER } from '../dtos/bank-transfer.dtos.js';

/** Chỉ các khóa này được đọc/ghi qua API thông tin chuyển khoản (whitelist). */
const BANK_KEYS = {
  bankName: 'bank.bankName',
  accountNumber: 'bank.accountNumber',
  accountHolder: 'bank.accountHolder',
  transferNote: 'bank.transferNote',
} as const;

export interface BankTransferInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferNote: string;
}

export interface PaymentInstructions {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferContent: string;
  amount: number;
}

export interface PayableOrder {
  code: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}

/**
 * Toàn bộ quy tắc thanh toán nằm ở đây để sau này thêm cổng thanh toán bên thứ ba
 * mà không phải sửa luồng đơn hàng.
 */
@Injectable()
export class PaymentService {
  constructor(private readonly settings: SettingsRepository) {}

  async getBankTransferInfo(): Promise<BankTransferInfo> {
    const values = await this.settings.findByKeys(Object.values(BANK_KEYS));
    return {
      bankName: values.get(BANK_KEYS.bankName) ?? '',
      accountNumber: values.get(BANK_KEYS.accountNumber) ?? '',
      accountHolder: values.get(BANK_KEYS.accountHolder) ?? '',
      transferNote: values.get(BANK_KEYS.transferNote) ?? ORDER_CODE_PLACEHOLDER,
    };
  }

  async saveBankTransferInfo(dto: BankTransferSettingsDto): Promise<BankTransferInfo> {
    const info: BankTransferInfo = {
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      accountHolder: dto.accountHolder,
      transferNote: dto.transferNote,
    };
    await this.settings.upsertMany({
      [BANK_KEYS.bankName]: info.bankName,
      [BANK_KEYS.accountNumber]: info.accountNumber,
      [BANK_KEYS.accountHolder]: info.accountHolder,
      [BANK_KEYS.transferNote]: info.transferNote,
    });
    return info;
  }

  /** Hướng dẫn chuyển khoản; null nếu không phải chuyển khoản hoặc đã thanh toán/đã hủy. */
  async buildInstructions(order: PayableOrder): Promise<PaymentInstructions | null> {
    if (
      order.paymentMethod !== PaymentMethod.BANK_TRANSFER ||
      order.paymentStatus !== PaymentStatus.UNPAID ||
      order.status === OrderStatus.CANCELLED
    ) {
      return null;
    }
    const info = await this.getBankTransferInfo();
    return {
      bankName: info.bankName,
      accountNumber: info.accountNumber,
      accountHolder: info.accountHolder,
      transferContent: info.transferNote.split(ORDER_CODE_PLACEHOLDER).join(order.code),
      amount: order.total,
    };
  }

  /** COD tự chuyển sang đã thanh toán khi giao thành công. */
  settlementOnDelivery(method: PaymentMethod): { paymentStatus: PaymentStatus; paidAt: Date } | null {
    return method === PaymentMethod.COD ? { paymentStatus: PaymentStatus.PAID, paidAt: new Date() } : null;
  }

  /** Admin chỉ được xác nhận/bỏ xác nhận thanh toán cho đơn chuyển khoản chưa hủy. */
  assertManualPaymentAllowed(order: Pick<PayableOrder, 'paymentMethod' | 'status'>): void {
    if (order.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
      throw new BusinessException(
        ErrorCode.INVALID_STATUS_TRANSITION,
        'Đơn thanh toán khi nhận hàng (COD) tự động chuyển đã thanh toán khi giao thành công, không xác nhận thủ công',
        HttpStatus.CONFLICT,
      );
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BusinessException(
        ErrorCode.INVALID_STATUS_TRANSITION,
        'Đơn đã hủy, không thể đổi trạng thái thanh toán',
        HttpStatus.CONFLICT,
      );
    }
  }
}
