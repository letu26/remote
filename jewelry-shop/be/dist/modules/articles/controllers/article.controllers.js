var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { AdminArticleListQueryDto, ArticleListQueryDto, CreateArticleDto, UpdateArticleDto, } from '../dtos/article.dtos.js';
import { ArticleService } from '../services/article.service.js';
let ArticleController = class ArticleController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(query) {
        return this.service.listPublic(query);
    }
    detail(slug) {
        return this.service.getPublicBySlug(slug);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ArticleListQueryDto]),
    __metadata("design:returntype", void 0)
], ArticleController.prototype, "list", null);
__decorate([
    Get(':slug'),
    __param(0, Param('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ArticleController.prototype, "detail", null);
ArticleController = __decorate([
    Controller('articles'),
    __metadata("design:paramtypes", [ArticleService])
], ArticleController);
export { ArticleController };
let ArticleAdminController = class ArticleAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(query) {
        return this.service.listAdmin(query);
    }
    detail(id) {
        return this.service.getAdmin(id);
    }
    create(admin, dto) {
        return this.service.create(admin.id, dto);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AdminArticleListQueryDto]),
    __metadata("design:returntype", void 0)
], ArticleAdminController.prototype, "list", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ArticleAdminController.prototype, "detail", null);
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateArticleDto]),
    __metadata("design:returntype", void 0)
], ArticleAdminController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateArticleDto]),
    __metadata("design:returntype", void 0)
], ArticleAdminController.prototype, "update", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ArticleAdminController.prototype, "remove", null);
ArticleAdminController = __decorate([
    Controller('admin/articles'),
    AdminOnly(),
    __metadata("design:paramtypes", [ArticleService])
], ArticleAdminController);
export { ArticleAdminController };
//# sourceMappingURL=article.controllers.js.map