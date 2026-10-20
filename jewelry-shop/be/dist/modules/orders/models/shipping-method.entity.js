var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
import { decimalTransformer } from '../../../utils/decimal.transformer.js';
let ShippingMethod = class ShippingMethod extends BaseEntity {
    name;
    description;
    fee;
    isActive;
};
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], ShippingMethod.prototype, "name", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ShippingMethod.prototype, "description", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 0, default: 0, transformer: decimalTransformer }),
    __metadata("design:type", Number)
], ShippingMethod.prototype, "fee", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], ShippingMethod.prototype, "isActive", void 0);
ShippingMethod = __decorate([
    Entity('shipping_methods')
], ShippingMethod);
export { ShippingMethod };
//# sourceMappingURL=shipping-method.entity.js.map