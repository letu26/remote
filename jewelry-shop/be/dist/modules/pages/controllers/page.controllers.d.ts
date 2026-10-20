import { CreatePageDto, UpdatePageDto } from '../dtos/page.dtos.js';
import { PageService } from '../services/page.service.js';
export declare class PageController {
    private readonly service;
    constructor(service: PageService);
    list(): Promise<{
        slug: string;
        title: string;
    }[]>;
    detail(slug: string): Promise<{
        slug: string;
        title: string;
        content: string;
        updatedAt: Date;
    }>;
}
export declare class PageAdminController {
    private readonly service;
    constructor(service: PageService);
    list(): Promise<{
        id: number;
        slug: string;
        title: string;
        content: string;
        isActive: boolean;
        isReserved: boolean;
        updatedAt: Date;
    }[]>;
    detail(id: number): Promise<{
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
}
