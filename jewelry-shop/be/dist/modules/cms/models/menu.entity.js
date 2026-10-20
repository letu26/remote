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
let Menu = class Menu extends BaseEntity {
    label;
    url;
    parentId;
    sortOrder;
    placement;
    isActive;
};
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], Menu.prototype, "label", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Menu.prototype, "url", void 0);
__decorate([
    Index(),
    Column({ type: 'int', unsigned: true, nullable: true }),
    __metadata("design:type", Object)
], Menu.prototype, "parentId", void 0);
__decorate([
    Column({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Menu.prototype, "sortOrder", void 0);
__decorate([
    Column({ type: 'enum', enum: ['header', 'footer'], default: 'header' }),
    __metadata("design:type", String)
], Menu.prototype, "placement", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Menu.prototype, "isActive", void 0);
Menu = __decorate([
    Entity('menus')
], Menu);
export { Menu };
//# sourceMappingURL=menu.entity.js.map