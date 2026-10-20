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
let ProductGemstone = class ProductGemstone extends BaseEntity {
    productId;
    gemstoneId;
    quantity;
    carat;
    color;
    clarity;
    cut;
};
__decorate([
    Index(),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], ProductGemstone.prototype, "productId", void 0);
__decorate([
    Index(),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], ProductGemstone.prototype, "gemstoneId", void 0);
__decorate([
    Column({ type: 'int', unsigned: true, default: 1 }),
    __metadata("design:type", Number)
], ProductGemstone.prototype, "quantity", void 0);
__decorate([
    Column({ type: 'decimal', precision: 8, scale: 3, nullable: true, transformer: decimalTransformer }),
    __metadata("design:type", Object)
], ProductGemstone.prototype, "carat", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], ProductGemstone.prototype, "color", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], ProductGemstone.prototype, "clarity", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], ProductGemstone.prototype, "cut", void 0);
ProductGemstone = __decorate([
    Entity('product_gemstones')
], ProductGemstone);
export { ProductGemstone };
//# sourceMappingURL=product-gemstone.entity.js.map