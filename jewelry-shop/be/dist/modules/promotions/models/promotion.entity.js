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
let Promotion = class Promotion extends BaseEntity {
    name;
    productId;
    discountPercent;
    startsAt;
    endsAt;
    isActive;
};
__decorate([
    Column({ length: 150 }),
    __metadata("design:type", String)
], Promotion.prototype, "name", void 0);
__decorate([
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Promotion.prototype, "productId", void 0);
__decorate([
    Column({ type: 'tinyint', unsigned: true }),
    __metadata("design:type", Number)
], Promotion.prototype, "discountPercent", void 0);
__decorate([
    Column({ type: 'datetime' }),
    __metadata("design:type", Date)
], Promotion.prototype, "startsAt", void 0);
__decorate([
    Column({ type: 'datetime' }),
    __metadata("design:type", Date)
], Promotion.prototype, "endsAt", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Promotion.prototype, "isActive", void 0);
Promotion = __decorate([
    Entity('promotions'),
    Index(['productId', 'startsAt', 'endsAt'])
], Promotion);
export { Promotion };
//# sourceMappingURL=promotion.entity.js.map