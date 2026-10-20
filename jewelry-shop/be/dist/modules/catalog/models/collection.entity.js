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
let Collection = class Collection extends BaseEntity {
    name;
    slug;
    description;
    bannerUrl;
    isActive;
};
__decorate([
    Column({ length: 150 }),
    __metadata("design:type", String)
], Collection.prototype, "name", void 0);
__decorate([
    Index({ unique: true }),
    Column({ length: 170 }),
    __metadata("design:type", String)
], Collection.prototype, "slug", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Collection.prototype, "description", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Collection.prototype, "bannerUrl", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Collection.prototype, "isActive", void 0);
Collection = __decorate([
    Entity('collections')
], Collection);
export { Collection };
//# sourceMappingURL=collection.entity.js.map