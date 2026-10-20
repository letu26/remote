import { PageQueryDto } from '../../../utils/pagination.js';
export declare class ArticleListQueryDto extends PageQueryDto {
    q?: string;
}
export declare class AdminArticleListQueryDto extends ArticleListQueryDto {
    published?: boolean;
}
export declare class CreateArticleDto {
    title: string;
    slug?: string;
    summary?: string | null;
    content: string;
    thumbnailUrl?: string | null;
    thumbnailPublicId?: string | null;
    isPublished?: boolean;
}
export declare class UpdateArticleDto {
    title?: string;
    slug?: string;
    summary?: string | null;
    content?: string;
    thumbnailUrl?: string | null;
    thumbnailPublicId?: string | null;
    isPublished?: boolean;
}
