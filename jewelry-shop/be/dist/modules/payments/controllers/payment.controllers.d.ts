import { BankTransferSettingsDto } from '../dtos/bank-transfer.dtos.js';
import { PaymentService } from '../services/payment.service.js';
export declare class PaymentInfoController {
    private readonly payments;
    constructor(payments: PaymentService);
    bankTransfer(): Promise<import("../services/payment.service.js").BankTransferInfo>;
}
export declare class BankTransferSettingsController {
    private readonly payments;
    constructor(payments: PaymentService);
    get(): Promise<import("../services/payment.service.js").BankTransferInfo>;
    save(dto: BankTransferSettingsDto): Promise<import("../services/payment.service.js").BankTransferInfo>;
}
