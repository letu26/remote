import { DataSource } from 'typeorm';
export interface BannerRow {
    id: number;
    title: string;
    imageUrl: string;
    imagePublicId: string | null;
    linkUrl: string | null;
    position: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
}
export interface BannerWrite {
    title?: string;
    imageUrl?: string;
    imagePublicId?: string | null;
    linkUrl?: string | null;
    position?: string;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class BannerRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findActive(position?: string): Promise<BannerRow[]>;
    findAll(): Promise<BannerRow[]>;
    findById(id: number): Promise<BannerRow | null>;
    insert(data: Required<Pick<BannerWrite, 'title' | 'imageUrl' | 'position'>> & BannerWrite): Promise<number>;
    update(id: number, data: BannerWrite): Promise<void>;
    delete(id: number): Promise<void>;
}
