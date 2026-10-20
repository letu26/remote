import type { CreatePageDto, UpdatePageDto } from '../dtos/page.dtos.js';
import { PageRepository } from '../repositories/page.repository.js';
export declare const RESERVED_PAGE_SLUGS: readonly string[];
export declare class PageService {
    private readonly pages;
    constructor(pages: PageRepository);
    listPublic(): Promise<{
        slug: string;
        title: string;
    }[]>;
    getPublic(slug: string): Promise<{
        slug: string;
        title: string;
        content: string;
        updatedAt: Date;
    }>;
    listAdmin(): Promise<{
        id: number;
        slug: string;
        title: string;
        content: string;
        isActive: boolean;
        isReserved: boolean;
        updatedAt: Date;
    }[]>;
    getAdmin(id: number): Promise<{
        id: number;
        slug: string;
        title: string;
        content: string;
        isActive: boolean;
        isReserved: boolean;
        updatedAt: Date;
    }>;
    create(dto: CreatePageDto): Promise<{
        id: number;
        slug: string;
        title: string;
        content: string;
        isActive: boolean;
        isReserved: boolean;
        updatedAt: Date;
    }>;
    update(id: number, dto: UpdatePageDto): Promise<{
        id: number;
        slug: string;
        title: string;
        content: string;
        isActive: boolean;
        isReserved: boolean;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<void>;
    private toAdmin;
    private getOrFail;
    private slugConflict;
    private reserved;
    private notFound;
}
