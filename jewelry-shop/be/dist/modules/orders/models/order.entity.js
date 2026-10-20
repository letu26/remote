var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
import { decimalTransformer } from '../../../utils/decimal.transformer.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from './order.enums.js';
let Order = class Order extends BaseEntity {
    code;
    userId;
    receiverName;
    receiverPhone;
    provinceName;
    wardName;
    addressDetail;
    note;
    shippingMethodId;
    shippingMethodName;
    subtotal;
    shippingFee;
    total;
    paymentMethod;
    paymentStatus;
    paidAt;
    status;
    cancelReason;
};
__decorate([
    Index({ unique: true }),
    Column({ length: 30 }),
    __metadata("design:type", String)
], Order.prototype, "code", void 0);
__decorate([
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Order.prototype, "userId", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], Order.prototype, "receiverName", void 0);
__decorate([
    Column({ length: 20 }),
    __metadata("design:type", String)
], Order.prototype, "receiverPhone", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], Order.prototype, "provinceName", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], Order.prototype, "wardName", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Order.prototype, "addressDetail", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "note", void 0);
__decorate([
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Order.prototype, "shippingMethodId", void 0);
__decorate([
    Column({ length: 100, default: '' }),
    __metadata("design:type", String)
], Order.prototype, "shippingMethodName", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "subtotal", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 0, default: 0, transformer: decimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "shippingFee", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer }),
    __metadata("design:type", Number)
], Order.prototype, "total", void 0);
__decorate([
    Column({ type: 'enum', enum: PaymentMethod }),
    __metadata("design:type", String)
], Order.prototype, "paymentMethod", void 0);
__decorate([
    Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    Column({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "paidAt", void 0);
__decorate([
    Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "cancelReason", void 0);
Order = __decorate([
    Entity('orders'),
    Index(['userId', 'createdAt']),
    Index(['status', 'createdAt'])
], Order);
export { Order };
//# sourceMappingURL=order.entity.js.map