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
let Review = class Review extends BaseEntity {
    userId;
    productId;
    orderItemId;
    rating;
    comment;
    isHidden;
};
__decorate([
    Index(),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Review.prototype, "userId", void 0);
__decorate([
    Index(),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Review.prototype, "productId", void 0);
__decorate([
    Index({ unique: true }),
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], Review.prototype, "orderItemId", void 0);
__decorate([
    Column({ type: 'tinyint', unsigned: true }),
    __metadata("design:type", Number)
], Review.prototype, "rating", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Review.prototype, "comment", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], Review.prototype, "isHidden", void 0);
Review = __decorate([
    Entity('reviews'),
    Index(['userId', 'productId'], { unique: true }),
    Index(['productId', 'isHidden', 'createdAt'])
], Review);
export { Review };
//# sourceMappingURL=review.entity.js.map