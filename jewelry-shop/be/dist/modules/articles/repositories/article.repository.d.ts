import { DataSource } from 'typeorm';
export interface ArticleListRow {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    thumbnailUrl: string | null;
    publishedAt: Date | null;
}
export interface AdminArticleListRow extends ArticleListRow {
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ArticleRow extends AdminArticleListRow {
    content: string;
    thumbnailPublicId: string | null;
    authorId: number | null;
}
export interface ArticleWrite {
    title?: string;
    slug?: string;
    summary?: string | null;
    content?: string;
    thumbnailUrl?: string | null;
    thumbnailPublicId?: string | null;
    authorId?: number | null;
    isPublished?: boolean;
    publishedAt?: Date | null;
}
export declare class ArticleRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findPublishedPage(q: string | undefined, limit: number, offset: number, now: Date): Promise<{
        rows: ArticleListRow[];
        total: number;
    }>;
    findPublishedBySlug(slug: string, now: Date): Promise<ArticleRow | null>;
    findRelated(excludeId: number, limit: number, now: Date): Promise<ArticleListRow[]>;
    findAdminPage(q: string | undefined, published: boolean | undefined, limit: number, offset: number): Promise<{
        rows: AdminArticleListRow[];
        total: number;
    }>;
    findById(id: number): Promise<ArticleRow | null>;
    findSlugsStartingWith(prefix: string): Promise<string[]>;
    insert(data: Required<Pick<ArticleWrite, 'title' | 'slug' | 'content'>> & ArticleWrite): Promise<number>;
    update(id: number, data: ArticleWrite): Promise<void>;
    delete(id: number): Promise<void>;
}
