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
let OrderItem = class OrderItem extends BaseEntity {
    orderId;
    variantId;
    productName;
    productCode;
    imageUrl;
    size;
    unitPrice;
    quantity;
    lineTotal;
};
__decorate([
    Index(),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], OrderItem.prototype, "orderId", void 0);
__decorate([
    Index(),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], OrderItem.prototype, "variantId", void 0);
__decorate([
    Column({ length: 200 }),
    __metadata("design:type", String)
], OrderItem.prototype, "productName", void 0);
__decorate([
    Column({ length: 50 }),
    __metadata("design:type", String)
], OrderItem.prototype, "productCode", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], OrderItem.prototype, "imageUrl", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, default: '' }),
    __metadata("design:type", String)
], OrderItem.prototype, "size", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer }),
    __metadata("design:type", Number)
], OrderItem.prototype, "unitPrice", void 0);
__decorate([
    Column({ type: 'int', unsigned: true }),
    __metadata("design:type", Number)
], OrderItem.prototype, "quantity", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer }),
    __metadata("design:type", Number)
], OrderItem.prototype, "lineTotal", void 0);
OrderItem = __decorate([
    Entity('order_items')
], OrderItem);
export { OrderItem };
//# sourceMappingURL=order-item.entity.js.map