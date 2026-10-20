var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, } from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { Trim } from '../../../utils/transforms.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../models/order.enums.js';
const ID_LIST = {
    min: 1,
    max: 50,
};
export class PreviewOrderDto {
    itemIds;
    shippingMethodId;
}
__decorate([
    IsArray(),
    ArrayMinSize(ID_LIST.min),
    ArrayMaxSize(ID_LIST.max),
    IsInt({ each: true }),
    Min(1, { each: true }),
    __metadata("design:type", Array)
], PreviewOrderDto.prototype, "itemIds", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], PreviewOrderDto.prototype, "shippingMethodId", void 0);
export class CreateOrderDto {
    itemIds;
    addressId;
    shippingMethodId;
    paymentMethod;
    note;
    expectedTotal;
}
__decorate([
    IsArray(),
    ArrayMinSize(ID_LIST.min),
    ArrayMaxSize(ID_LIST.max),
    IsInt({ each: true }),
    Min(1, { each: true }),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "itemIds", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "addressId", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "shippingMethodId", void 0);
__decorate([
    IsEnum(PaymentMethod),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "paymentMethod", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "note", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(1_000_000_000_000),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "expectedTotal", void 0);
export class CancelOrderDto {
    reason;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], CancelOrderDto.prototype, "reason", void 0);
export class OrderListQueryDto extends PageQueryDto {
    status;
}
__decorate([
    IsOptional(),
    IsEnum(OrderStatus),
    __metadata("design:type", String)
], OrderListQueryDto.prototype, "status", void 0);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export class AdminOrderListQueryDto extends PageQueryDto {
    q;
    status;
    paymentStatus;
    userId;
    from;
    to;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], AdminOrderListQueryDto.prototype, "q", void 0);
__decorate([
    IsOptional(),
    IsEnum(OrderStatus),
    __metadata("design:type", String)
], AdminOrderListQueryDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsEnum(PaymentStatus),
    __metadata("design:type", String)
], AdminOrderListQueryDto.prototype, "paymentStatus", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], AdminOrderListQueryDto.prototype, "userId", void 0);
__decorate([
    IsOptional(),
    Matches(DATE_PATTERN, { message: 'Ngày phải theo dạng yyyy-MM-dd' }),
    __metadata("design:type", String)
], AdminOrderListQueryDto.prototype, "from", void 0);
__decorate([
    IsOptional(),
    Matches(DATE_PATTERN, { message: 'Ngày phải theo dạng yyyy-MM-dd' }),
    __metadata("design:type", String)
], AdminOrderListQueryDto.prototype, "to", void 0);
export class UpdateOrderStatusDto {
    status;
    note;
}
__decorate([
    IsEnum(OrderStatus),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "note", void 0);
export class UpdateOrderPaymentDto {
    paymentStatus;
    note;
}
__decorate([
    IsIn([PaymentStatus.PAID, PaymentStatus.UNPAID]),
    __metadata("design:type", String)
], UpdateOrderPaymentDto.prototype, "paymentStatus", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], UpdateOrderPaymentDto.prototype, "note", void 0);
//# sourceMappingURL=order.dtos.js.map