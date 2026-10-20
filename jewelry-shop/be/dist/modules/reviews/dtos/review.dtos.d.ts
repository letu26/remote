import { PageQueryDto } from '../../../utils/pagination.js';
export declare const MAX_COMMENT_LENGTH = 1000;
export declare class CreateReviewDto {
    rating: number;
    comment?: string | null;
}
export declare class UpdateReviewDto {
    rating?: number;
    comment?: string | null;
}
export declare class ReviewListQueryDto extends PageQueryDto {
    rating?: number;
}
export declare class AdminReviewListQueryDto extends PageQueryDto {
    q?: string;
    rating?: number;
    hidden?: boolean;
    productId?: number;
}
export declare class UpdateReviewVisibilityDto {
    isHidden: boolean;
}
