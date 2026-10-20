var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../orders/models/order.enums.js';
import { SettingsRepository } from '../../settings/repositories/settings.repository.js';
import { ORDER_CODE_PLACEHOLDER } from '../dtos/bank-transfer.dtos.js';
const BANK_KEYS = {
    bankName: 'bank.bankName',
    accountNumber: 'bank.accountNumber',
    accountHolder: 'bank.accountHolder',
    transferNote: 'bank.transferNote',
};
let PaymentService = class PaymentService {
    settings;
    constructor(settings) {
        this.settings = settings;
    }
    async getBankTransferInfo() {
        const values = await this.settings.findByKeys(Object.values(BANK_KEYS));
        return {
            bankName: values.get(BANK_KEYS.bankName) ?? '',
            accountNumber: values.get(BANK_KEYS.accountNumber) ?? '',
            accountHolder: values.get(BANK_KEYS.accountHolder) ?? '',
            transferNote: values.get(BANK_KEYS.transferNote) ?? ORDER_CODE_PLACEHOLDER,
        };
    }
    async saveBankTransferInfo(dto) {
        const info = {
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
    async buildInstructions(order) {
        if (order.paymentMethod !== PaymentMethod.BANK_TRANSFER ||
            order.paymentStatus !== PaymentStatus.UNPAID ||
            order.status === OrderStatus.CANCELLED) {
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
    settlementOnDelivery(method) {
        return method === PaymentMethod.COD ? { paymentStatus: PaymentStatus.PAID, paidAt: new Date() } : null;
    }
    assertManualPaymentAllowed(order) {
        if (order.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
            throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 'Đơn thanh toán khi nhận hàng (COD) tự động chuyển đã thanh toán khi giao thành công, không xác nhận thủ công', HttpStatus.CONFLICT);
        }
        if (order.status === OrderStatus.CANCELLED) {
            throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 'Đơn đã hủy, không thể đổi trạng thái thanh toán', HttpStatus.CONFLICT);
        }
    }
};
PaymentService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SettingsRepository])
], PaymentService);
export { PaymentService };
//# sourceMappingURL=payment.service.js.map