import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { AdminArticleListQueryDto, ArticleListQueryDto, CreateArticleDto, UpdateArticleDto } from '../dtos/article.dtos.js';
import { ArticleService } from '../services/article.service.js';
export declare class ArticleController {
    private readonly service;
    constructor(service: ArticleService);
    list(query: ArticleListQueryDto): Promise<import("../../../utils/pagination.js").Page<import("../repositories/article.repository.js").ArticleListRow>>;
    detail(slug: string): Promise<{
        id: number;
        title: string;
        slug: string;
        summary: string | null;
        content: string;
        thumbnailUrl: string | null;
        publishedAt: Date | null;
        updatedAt: Date;
        related: import("../repositories/article.repository.js").ArticleListRow[];
    }>;
}
export declare class ArticleAdminController {
    private readonly service;
    constructor(service: ArticleService);
    list(query: AdminArticleListQueryDto): Promise<import("../../../utils/pagination.js").Page<import("../repositories/article.repository.js").AdminArticleListRow>>;
    detail(id: number): Promise<import("../repositories/article.repository.js").ArticleRow>;
    create(admin: AuthenticatedUser, dto: CreateArticleDto): Promise<import("../repositories/article.repository.js").ArticleRow>;
    update(id: number, dto: UpdateArticleDto): Promise<import("../repositories/article.repository.js").ArticleRow>;
    remove(id: number): Promise<void>;
}
