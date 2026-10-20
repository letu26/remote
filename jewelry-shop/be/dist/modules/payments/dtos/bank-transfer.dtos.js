var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Contains, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';
export const ORDER_CODE_PLACEHOLDER = '{orderCode}';
export class BankTransferSettingsDto {
    bankName;
    accountNumber;
    accountHolder;
    transferNote;
}
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(100),
    __metadata("design:type", String)
], BankTransferSettingsDto.prototype, "bankName", void 0);
__decorate([
    Trim(),
    IsString(),
    MinLength(4),
    MaxLength(30),
    Matches(/^[0-9 ]+$/, { message: 'Số tài khoản chỉ gồm chữ số hoặc khoảng trắng' }),
    __metadata("design:type", String)
], BankTransferSettingsDto.prototype, "accountNumber", void 0);
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(100),
    __metadata("design:type", String)
], BankTransferSettingsDto.prototype, "accountHolder", void 0);
__decorate([
    Trim(),
    IsString(),
    MinLength(1),
    MaxLength(100),
    Contains(ORDER_CODE_PLACEHOLDER, { message: 'Nội dung chuyển khoản phải chứa {orderCode}' }),
    __metadata("design:type", String)
], BankTransferSettingsDto.prototype, "transferNote", void 0);
//# sourceMappingURL=bank-transfer.dtos.js.map