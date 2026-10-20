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
let Faq = class Faq extends BaseEntity {
    question;
    answer;
    keywords;
    sortOrder;
    isActive;
};
__decorate([
    Column({ length: 500 }),
    __metadata("design:type", String)
], Faq.prototype, "question", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], Faq.prototype, "answer", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Faq.prototype, "keywords", void 0);
__decorate([
    Column({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Faq.prototype, "sortOrder", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Faq.prototype, "isActive", void 0);
Faq = __decorate([
    Entity('faqs')
], Faq);
export { Faq };
//# sourceMappingURL=faq.entity.js.map