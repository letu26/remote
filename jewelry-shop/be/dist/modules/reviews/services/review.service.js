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
import { AccessDeniedException, BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { getDuplicateInfo } from '../../../utils/db-error.util.js';
import { resolvePage, toPage } from '../../../utils/pagination.js';
import { maskReviewerName } from '../../../utils/reviewer-name.util.js';
import { ReviewQueryRepository } from '../repositories/review-query.repository.js';
import { ReviewRepository } from '../repositories/review.repository.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const STARS = [1, 2, 3, 4, 5];
const normalizeComment = (comment) => comment?.trim() || null;
let ReviewService = class ReviewService {
    reviews;
    queries;
    catalog;
    constructor(reviews, queries, catalog) {
        this.reviews = reviews;
        this.queries = queries;
        this.catalog = catalog;
    }
    async listForProduct(slug, query, viewerId) {
        const productId = await this.requireProductId(slug);
        const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const [distribution, { rows, total }] = await Promise.all([
            this.queries.countByRating(productId),
            this.queries.findVisiblePage(productId, query.rating, request.pageSize, request.offset),
        ]);
        const counts = Object.fromEntries(STARS.map((star) => [star, distribution.get(star) ?? 0]));
        const reviewCount = STARS.reduce((sum, star) => sum + counts[star], 0);
        const ratingSum = STARS.reduce((sum, star) => sum + star * counts[star], 0);
        const avgRating = reviewCount ? Math.round((ratingSum / reviewCount) * 100) / 100 : 0;
        const items = rows.map((row) => ({
            id: row.id,
            rating: row.rating,
            comment: row.comment,
            reviewerName: maskReviewerName(row.fullName),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            isMine: viewerId !== null && row.userId === viewerId,
        }));
        return { summary: { avgRating, reviewCount, distribution: counts }, ...toPage(items, total, request) };
    }
    async getMyReview(userId, slug) {
        const productId = await this.requireProductId(slug);
        const review = await this.queries.findByUserAndProduct(userId, productId);
        if (review)
            return { eligible: false, reason: 'ALREADY_REVIEWED', review };
        const purchased = (await this.queries.findLatestDeliveredOrderItemId(userId, productId)) !== null;
        return purchased
            ? { eligible: true, reason: null, review: null }
            : { eligible: false, reason: 'NOT_PURCHASED', review: null };
    }
    async create(userId, slug, dto) {
        const productId = await this.requireProductId(slug);
        const orderItemId = await this.queries.findLatestDeliveredOrderItemId(userId, productId);
        if (orderItemId === null) {
            throw new AccessDeniedException('Chỉ khách đã mua và nhận hàng mới có thể đánh giá sản phẩm này', ErrorCode.REVIEW_NOT_ALLOWED);
        }
        let id;
        try {
            id = await this.reviews.create({ userId, productId, orderItemId, rating: dto.rating, comment: normalizeComment(dto.comment) });
        }
        catch (error) {
            if (getDuplicateInfo(error)?.table === 'reviews') {
                throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS, 'Bạn đã đánh giá sản phẩm này rồi', HttpStatus.CONFLICT);
            }
            throw error;
        }
        return this.getOrFail(id);
    }
    async update(userId, id, dto) {
        if (dto.rating === undefined && dto.comment === undefined) {
            throw new ValidationException([{ field: 'rating', message: 'Cần ít nhất một trường: rating hoặc comment' }]);
        }
        const outcome = await this.reviews.withLockedReview({ id, userId }, async (tx) => {
            if (tx.review.isHidden)
                return 'hidden';
            await tx.update({
                rating: dto.rating,
                comment: dto.comment === undefined ? undefined : normalizeComment(dto.comment),
            });
            return 'ok';
        });
        if (outcome === null)
            throw this.notFound();
        if (outcome === 'hidden') {
            throw new AccessDeniedException('Đánh giá của bạn đang bị ẩn bởi quản trị viên nên chưa thể chỉnh sửa', ErrorCode.REVIEW_HIDDEN);
        }
        return this.getOrFail(id);
    }
    async remove(userId, id) {
        const outcome = await this.reviews.withLockedReview({ id, userId }, (tx) => tx.remove());
        if (outcome === null)
            throw this.notFound();
    }
    async listMine(userId, query) {
        const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const { rows, total } = await this.queries.findMinePage(userId, request.pageSize, request.offset);
        return toPage(rows, total, request);
    }
    async requireProductId(slug) {
        const product = await this.queries.findActiveProductBySlug(slug);
        const visibleCategories = this.catalog.flattenTree(await this.catalog.getCategoryTree());
        if (!product || !visibleCategories.has(product.categoryId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
        }
        return product.id;
    }
    async getOrFail(id) {
        const review = await this.queries.findById(id);
        if (!review)
            throw this.notFound();
        return review;
    }
    notFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy đánh giá', HttpStatus.NOT_FOUND);
    }
};
ReviewService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ReviewRepository,
        ReviewQueryRepository,
        CatalogService])
], ReviewService);
export { ReviewService };
//# sourceMappingURL=review.service.js.map