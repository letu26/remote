import { BaseEntity } from '../../../models/base.entity.js';
export declare class Article extends BaseEntity {
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    thumbnailPublicId: string | null;
    summary: string | null;
    content: string;
    authorId: number | null;
    isPublished: boolean;
    publishedAt: Date | null;
}
