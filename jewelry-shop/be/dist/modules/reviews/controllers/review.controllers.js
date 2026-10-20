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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards, } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../../guards/optional-jwt-auth.guard.js';
import { PageQueryDto } from '../../../utils/pagination.js';
import { AdminReviewListQueryDto, CreateReviewDto, ReviewListQueryDto, UpdateReviewDto, UpdateReviewVisibilityDto, } from '../dtos/review.dtos.js';
import { ReviewAdminService } from '../services/review-admin.service.js';
import { ReviewService } from '../services/review.service.js';
let ReviewController = class ReviewController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(slug, query, req) {
        return this.service.listForProduct(slug, query, req.user?.id ?? null);
    }
    myReview(user, slug) {
        return this.service.getMyReview(user.id, slug);
    }
    create(user, slug, dto) {
        return this.service.create(user.id, slug, dto);
    }
    mine(user, query) {
        return this.service.listMine(user.id, query);
    }
    update(user, id, dto) {
        return this.service.update(user.id, id, dto);
    }
    remove(user, id) {
        return this.service.remove(user.id, id);
    }
};
__decorate([
    Get('products/:slug/reviews'),
    UseGuards(OptionalJwtAuthGuard),
    __param(0, Param('slug')),
    __param(1, Query()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReviewListQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "list", null);
__decorate([
    Get('products/:slug/my-review'),
    UseGuards(JwtAuthGuard),
    __param(0, CurrentUser()),
    __param(1, Param('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "myReview", null);
__decorate([
    Post('products/:slug/reviews'),
    UseGuards(JwtAuthGuard),
    __param(0, CurrentUser()),
    __param(1, Param('slug')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CreateReviewDto]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "create", null);
__decorate([
    Get('reviews/me'),
    UseGuards(JwtAuthGuard),
    __param(0, CurrentUser()),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PageQueryDto]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "mine", null);
__decorate([
    Patch('reviews/:id'),
    UseGuards(JwtAuthGuard),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseIntPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, UpdateReviewDto]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "update", null);
__decorate([
    Delete('reviews/:id'),
    UseGuards(JwtAuthGuard),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], ReviewController.prototype, "remove", null);
ReviewController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [ReviewService])
], ReviewController);
export { ReviewController };
let ReviewAdminController = class ReviewAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(query) {
        return this.service.list(query);
    }
    setVisibility(id, dto) {
        return this.service.setVisibility(id, dto.isHidden);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AdminReviewListQueryDto]),
    __metadata("design:returntype", void 0)
], ReviewAdminController.prototype, "list", null);
__decorate([
    Patch(':id/visibility'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateReviewVisibilityDto]),
    __metadata("design:returntype", void 0)
], ReviewAdminController.prototype, "setVisibility", null);
ReviewAdminController = __decorate([
    Controller('admin/reviews'),
    AdminOnly(),
    __metadata("design:paramtypes", [ReviewAdminService])
], ReviewAdminController);
export { ReviewAdminController };
//# sourceMappingURL=review.controllers.js.map