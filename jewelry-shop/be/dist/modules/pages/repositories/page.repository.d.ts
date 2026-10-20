import { DataSource } from 'typeorm';
export interface PageRow {
    id: number;
    slug: string;
    title: string;
    content: string;
    isActive: boolean;
    updatedAt: Date;
}
export interface PageWrite {
    slug?: string;
    title?: string;
    content?: string;
    isActive?: boolean;
}
export declare class PageRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findActiveSummaries(): Promise<{
        slug: string;
        title: string;
    }[]>;
    findActiveBySlug(slug: string): Promise<PageRow | null>;
    findAll(): Promise<PageRow[]>;
    findById(id: number): Promise<PageRow | null>;
    insert(data: Required<Pick<PageWrite, 'slug' | 'title' | 'content'>> & PageWrite): Promise<number>;
    update(id: number, data: PageWrite): Promise<void>;
    delete(id: number): Promise<void>;
}
