var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { BankTransferSettingsDto } from '../dtos/bank-transfer.dtos.js';
import { PaymentService } from '../services/payment.service.js';
let PaymentInfoController = class PaymentInfoController {
    payments;
    constructor(payments) {
        this.payments = payments;
    }
    bankTransfer() {
        return this.payments.getBankTransferInfo();
    }
};
__decorate([
    Get('bank-transfer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentInfoController.prototype, "bankTransfer", null);
PaymentInfoController = __decorate([
    Controller('payment-info'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [PaymentService])
], PaymentInfoController);
export { PaymentInfoController };
let BankTransferSettingsController = class BankTransferSettingsController {
    payments;
    constructor(payments) {
        this.payments = payments;
    }
    get() {
        return this.payments.getBankTransferInfo();
    }
    save(dto) {
        return this.payments.saveBankTransferInfo(dto);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BankTransferSettingsController.prototype, "get", null);
__decorate([
    Put(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BankTransferSettingsDto]),
    __metadata("design:returntype", void 0)
], BankTransferSettingsController.prototype, "save", null);
BankTransferSettingsController = __decorate([
    Controller('admin/settings/bank-transfer'),
    AdminOnly(),
    __metadata("design:paramtypes", [PaymentService])
], BankTransferSettingsController);
export { BankTransferSettingsController };
//# sourceMappingURL=payment.controllers.js.map