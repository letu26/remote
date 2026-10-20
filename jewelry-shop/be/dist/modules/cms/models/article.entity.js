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
let Article = class Article extends BaseEntity {
    title;
    slug;
    thumbnailUrl;
    thumbnailPublicId;
    summary;
    content;
    authorId;
    isPublished;
    publishedAt;
};
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Article.prototype, "title", void 0);
__decorate([
    Index({ unique: true }),
    Column({ length: 280 }),
    __metadata("design:type", String)
], Article.prototype, "slug", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Article.prototype, "thumbnailUrl", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Article.prototype, "thumbnailPublicId", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Article.prototype, "summary", void 0);
__decorate([
    Column({ type: 'longtext' }),
    __metadata("design:type", String)
], Article.prototype, "content", void 0);
__decorate([
    Column({ type: 'int', unsigned: true, nullable: true }),
    __metadata("design:type", Object)
], Article.prototype, "authorId", void 0);
__decorate([
    Index(),
    Column({ default: false }),
    __metadata("design:type", Boolean)
], Article.prototype, "isPublished", void 0);
__decorate([
    Column({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Article.prototype, "publishedAt", void 0);
Article = __decorate([
    Entity('articles')
], Article);
export { Article };
//# sourceMappingURL=article.entity.js.map