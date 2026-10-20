import { type Page } from '../../../utils/pagination.js';
import { ImageCleanupService } from '../../media/services/image-cleanup.service.js';
import type { AdminArticleListQueryDto, ArticleListQueryDto, CreateArticleDto, UpdateArticleDto } from '../dtos/article.dtos.js';
import { type AdminArticleListRow, type ArticleListRow, type ArticleRow, ArticleRepository } from '../repositories/article.repository.js';
export declare class ArticleService {
    private readonly articles;
    private readonly cleanup;
    constructor(articles: ArticleRepository, cleanup: ImageCleanupService);
    listPublic(query: ArticleListQueryDto): Promise<Page<ArticleListRow>>;
    getPublicBySlug(slug: string): Promise<{
        id: number;
        title: string;
        slug: string;
        summary: string | null;
        content: string;
        thumbnailUrl: string | null;
        publishedAt: Date | null;
        updatedAt: Date;
        related: ArticleListRow[];
    }>;
    listAdmin(query: AdminArticleListQueryDto): Promise<Page<AdminArticleListRow>>;
    getAdmin(id: number): Promise<ArticleRow>;
    create(authorId: number, dto: CreateArticleDto): Promise<ArticleRow>;
    update(id: number, dto: UpdateArticleDto): Promise<ArticleRow>;
    remove(id: number): Promise<void>;
    private getOrFail;
    private notFound;
}
