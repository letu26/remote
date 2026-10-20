import { DataSource, Repository } from 'typeorm';
import { Collection } from '../../catalog/models/collection.entity.js';
export interface CollectionAdminRow {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    bannerUrl: string | null;
    isActive: boolean;
    productCount: number;
}
export interface CollectionWrite {
    name?: string;
    slug?: string;
    description?: string | null;
    bannerUrl?: string | null;
    isActive?: boolean;
}
export declare class CollectionAdminRepository {
    private readonly repo;
    private readonly dataSource;
    constructor(repo: Repository<Collection>, dataSource: DataSource);
    findAll(): Promise<CollectionAdminRow[]>;
    findById(id: number): Promise<CollectionAdminRow | null>;
    findSlugsStartingWith(prefix: string): Promise<string[]>;
    insert(data: Required<Pick<CollectionWrite, 'name' | 'slug'>> & CollectionWrite): Promise<number>;
    update(id: number, data: CollectionWrite): Promise<void>;
    delete(id: number): Promise<void>;
    private toRow;
}
