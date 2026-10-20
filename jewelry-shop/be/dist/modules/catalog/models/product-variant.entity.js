var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, Index, VersionColumn } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
let ProductVariant = class ProductVariant extends BaseEntity {
    productId;
    sku;
    size;
    stock;
    isActive;
    version;
};
__decorate([
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "productId", void 0);
__decorate([
    Index({ unique: true }),
    Column({ length: 60 }),
    __metadata("design:type", String)
], ProductVariant.prototype, "sku", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, default: '' }),
    __metadata("design:type", String)
], ProductVariant.prototype, "size", void 0);
__decorate([
    Column({ type: 'int', unsigned: true, default: 0 }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "stock", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], ProductVariant.prototype, "isActive", void 0);
__decorate([
    VersionColumn(),
    __metadata("design:type", Number)
], ProductVariant.prototype, "version", void 0);
ProductVariant = __decorate([
    Entity('product_variants'),
    Index(['productId', 'size'], { unique: true })
], ProductVariant);
export { ProductVariant };
//# sourceMappingURL=product-variant.entity.js.map