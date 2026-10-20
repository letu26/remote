import { OrderStatus, PaymentMethod, PaymentStatus } from '../../orders/models/order.enums.js';
import { SettingsRepository } from '../../settings/repositories/settings.repository.js';
import { BankTransferSettingsDto } from '../dtos/bank-transfer.dtos.js';
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
export declare class PaymentService {
    private readonly settings;
    constructor(settings: SettingsRepository);
    getBankTransferInfo(): Promise<BankTransferInfo>;
    saveBankTransferInfo(dto: BankTransferSettingsDto): Promise<BankTransferInfo>;
    buildInstructions(order: PayableOrder): Promise<PaymentInstructions | null>;
    settlementOnDelivery(method: PaymentMethod): {
        paymentStatus: PaymentStatus;
        paidAt: Date;
    } | null;
    assertManualPaymentAllowed(order: Pick<PayableOrder, 'paymentMethod' | 'status'>): void;
}
