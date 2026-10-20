import type { Request } from 'express';
import { PageQueryDto } from '../../../utils/pagination.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { AdminReviewListQueryDto, CreateReviewDto, ReviewListQueryDto, UpdateReviewDto, UpdateReviewVisibilityDto } from '../dtos/review.dtos.js';
import { ReviewAdminService } from '../services/review-admin.service.js';
import { ReviewService } from '../services/review.service.js';
export declare class ReviewController {
    private readonly service;
    constructor(service: ReviewService);
    list(slug: string, query: ReviewListQueryDto, req: Request & {
        user?: AuthenticatedUser;
    }): Promise<{
        items: {
            id: number;
            rating: number;
            comment: string | null;
            reviewerName: string;
            createdAt: Date;
            updatedAt: Date;
            isMine: boolean;
        }[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        summary: {
            avgRating: number;
            reviewCount: number;
            distribution: Record<number, number>;
        };
    }>;
    myReview(user: AuthenticatedUser, slug: string): Promise<{
        eligible: boolean;
        reason: "ALREADY_REVIEWED";
        review: import("../repositories/review-query.repository.js").ReviewRow;
    } | {
        eligible: boolean;
        reason: null;
        review: null;
    } | {
        eligible: boolean;
        reason: "NOT_PURCHASED";
        review: null;
    }>;
    create(user: AuthenticatedUser, slug: string, dto: CreateReviewDto): Promise<import("../repositories/review-query.repository.js").ReviewRow>;
    mine(user: AuthenticatedUser, query: PageQueryDto): Promise<import("../../../utils/pagination.js").Page<unknown>>;
    update(user: AuthenticatedUser, id: number, dto: UpdateReviewDto): Promise<import("../repositories/review-query.repository.js").ReviewRow>;
    remove(user: AuthenticatedUser, id: number): Promise<void>;
}
export declare class ReviewAdminController {
    private readonly service;
    constructor(service: ReviewAdminService);
    list(query: AdminReviewListQueryDto): Promise<import("../../../utils/pagination.js").Page<import("../repositories/review-query.repository.js").AdminReviewRow>>;
    setVisibility(id: number, dto: UpdateReviewVisibilityDto): Promise<import("../repositories/review-query.repository.js").AdminReviewRow>;
}
