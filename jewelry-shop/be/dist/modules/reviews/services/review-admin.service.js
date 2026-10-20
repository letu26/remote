var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { resolvePage, toPage } from '../../../utils/pagination.js';
import { ReviewQueryRepository } from '../repositories/review-query.repository.js';
import { ReviewRepository } from '../repositories/review.repository.js';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
let ReviewAdminService = class ReviewAdminService {
    reviews;
    queries;
    constructor(reviews, queries) {
        this.reviews = reviews;
        this.queries = queries;
    }
    async list(query) {
        const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const { rows, total } = await this.queries.findAdminPage({ q: query.q || undefined, rating: query.rating, hidden: query.hidden, productId: query.productId }, request.pageSize, request.offset);
        return toPage(rows, total, request);
    }
    async setVisibility(id, isHidden) {
        const outcome = await this.reviews.withLockedReview({ id }, async (tx) => {
            if (tx.review.isHidden !== isHidden)
                await tx.setHidden(isHidden);
            return true;
        });
        const review = outcome === null ? null : await this.queries.findAdminById(id);
        if (!review)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy đánh giá', HttpStatus.NOT_FOUND);
        return review;
    }
};
ReviewAdminService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ReviewRepository,
        ReviewQueryRepository])
], ReviewAdminService);
export { ReviewAdminService };
//# sourceMappingURL=review-admin.service.js.map