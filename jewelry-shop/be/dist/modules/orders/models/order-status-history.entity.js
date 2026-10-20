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
import { OrderStatus } from './order.enums.js';
let OrderStatusHistory = class OrderStatusHistory extends BaseEntity {
    orderId;
    status;
    changedById;
    note;
};
__decorate([
    Index(),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], OrderStatusHistory.prototype, "orderId", void 0);
__decorate([
    Column({ type: 'enum', enum: OrderStatus }),
    __metadata("design:type", String)
], OrderStatusHistory.prototype, "status", void 0);
__decorate([
    Column({ type: 'int', unsigned: true, nullable: true }),
    __metadata("design:type", Object)
], OrderStatusHistory.prototype, "changedById", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], OrderStatusHistory.prototype, "note", void 0);
OrderStatusHistory = __decorate([
    Entity('order_status_history')
], OrderStatusHistory);
export { OrderStatusHistory };
//# sourceMappingURL=order-status-history.entity.js.map