import { type Page } from '../../../utils/pagination.js';
import type { AdminReviewListQueryDto } from '../dtos/review.dtos.js';
import { type AdminReviewRow, ReviewQueryRepository } from '../repositories/review-query.repository.js';
import { ReviewRepository } from '../repositories/review.repository.js';
export declare class ReviewAdminService {
    private readonly reviews;
    private readonly queries;
    constructor(reviews: ReviewRepository, queries: ReviewQueryRepository);
    list(query: AdminReviewListQueryDto): Promise<Page<AdminReviewRow>>;
    setVisibility(id: number, isHidden: boolean): Promise<AdminReviewRow>;
}
