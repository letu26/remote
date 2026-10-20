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
let Material = class Material extends BaseEntity {
    name;
    isActive;
};
__decorate([
    Index({ unique: true }),
    Column({ length: 100 }),
    __metadata("design:type", String)
], Material.prototype, "name", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Material.prototype, "isActive", void 0);
Material = __decorate([
    Entity('materials')
], Material);
export { Material };
//# sourceMappingURL=material.entity.js.map