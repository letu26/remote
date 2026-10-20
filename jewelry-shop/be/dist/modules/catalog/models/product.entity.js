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
export var TargetGroup;
(function (TargetGroup) {
    TargetGroup["MEN"] = "men";
    TargetGroup["WOMEN"] = "women";
    TargetGroup["UNISEX"] = "unisex";
    TargetGroup["KIDS"] = "kids";
})(TargetGroup || (TargetGroup = {}));
let Product = class Product extends BaseEntity {
    code;
    name;
    slug;
    description;
    categoryId;
    materialId;
    collectionId;
    targetGroup;
    weight;
    costPrice;
    price;
    warrantyInfo;
    certificate;
    isFeatured;
    isActive;
    soldCount;
    avgRating;
    reviewCount;
};
__decorate([
    Index({ unique: true }),
    Column({ length: 50 }),
    __metadata("design:type", String)
], Product.prototype, "code", void 0);
__decorate([
    Column({ length: 200 }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    Index({ unique: true }),
    Column({ length: 220 }),
    __metadata("design:type", String)
], Product.prototype, "slug", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "description", void 0);
__decorate([
    Index(),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Product.prototype, "categoryId", void 0);
__decorate([
    Index(),
    Column({ type: 'int', unsigned: true, nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "materialId", void 0);
__decorate([
    Index(),
    Column({ type: 'int', unsigned: true, nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "collectionId", void 0);
__decorate([
    Column({ type: 'enum', enum: TargetGroup, default: TargetGroup.UNISEX }),
    __metadata("design:type", String)
], Product.prototype, "targetGroup", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 3, nullable: true, transformer: decimalTransformer }),
    __metadata("design:type", Object)
], Product.prototype, "weight", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 0, default: 0, transformer: decimalTransformer }),
    __metadata("design:type", Number)
], Product.prototype, "costPrice", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 0, transformer: decimalTransformer }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "warrantyInfo", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "certificate", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "isFeatured", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isActive", void 0);
__decorate([
    Column({ type: 'int', unsigned: true, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "soldCount", void 0);
__decorate([
    Column({ type: 'decimal', precision: 3, scale: 2, default: 0, transformer: decimalTransformer }),
    __metadata("design:type", Number)
], Product.prototype, "avgRating", void 0);
__decorate([
    Column({ type: 'int', unsigned: true, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "reviewCount", void 0);
Product = __decorate([
    Entity('products'),
    Index(['isActive', 'categoryId', 'price'])
], Product);
export { Product };
//# sourceMappingURL=product.entity.js.map