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
let Address = class Address extends BaseEntity {
    userId;
    receiverName;
    receiverPhone;
    provinceId;
    wardId;
    detail;
    isDefault;
};
__decorate([
    Index(),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Address.prototype, "userId", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], Address.prototype, "receiverName", void 0);
__decorate([
    Column({ length: 20 }),
    __metadata("design:type", String)
], Address.prototype, "receiverPhone", void 0);
__decorate([
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Address.prototype, "provinceId", void 0);
__decorate([
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Address.prototype, "wardId", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Address.prototype, "detail", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], Address.prototype, "isDefault", void 0);
Address = __decorate([
    Entity('addresses')
], Address);
export { Address };
//# sourceMappingURL=address.entity.js.map