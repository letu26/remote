import { type Page } from '../../../utils/pagination.js';
import type { CreateReviewDto, ReviewListQueryDto, UpdateReviewDto } from '../dtos/review.dtos.js';
import { type ReviewRow, ReviewQueryRepository } from '../repositories/review-query.repository.js';
import { ReviewRepository } from '../repositories/review.repository.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import type { PageQueryDto } from '../../../utils/pagination.js';
export declare class ReviewService {
    private readonly reviews;
    private readonly queries;
    private readonly catalog;
    constructor(reviews: ReviewRepository, queries: ReviewQueryRepository, catalog: CatalogService);
    listForProduct(slug: string, query: ReviewListQueryDto, viewerId: number | null): Promise<{
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
    getMyReview(userId: number, slug: string): Promise<{
        eligible: boolean;
        reason: "ALREADY_REVIEWED";
        review: ReviewRow;
    } | {
        eligible: boolean;
        reason: null;
        review: null;
    } | {
        eligible: boolean;
        reason: "NOT_PURCHASED";
        review: null;
    }>;
    create(userId: number, slug: string, dto: CreateReviewDto): Promise<ReviewRow>;
    update(userId: number, id: number, dto: UpdateReviewDto): Promise<ReviewRow>;
    remove(userId: number, id: number): Promise<void>;
    listMine(userId: number, query: PageQueryDto): Promise<Page<unknown>>;
    private requireProductId;
    private getOrFail;
    private notFound;
}
