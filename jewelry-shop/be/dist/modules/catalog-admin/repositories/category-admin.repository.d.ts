import { DataSource, Repository } from 'typeorm';
import { Category } from '../../catalog/models/category.entity.js';
export interface CategoryAdminRow {
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
    sortOrder: number;
    isActive: boolean;
    productCount: number;
    childCount: number;
}
export interface CategoryWrite {
    name?: string;
    slug?: string;
    parentId?: number | null;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class CategoryAdminRepository {
    private readonly repo;
    private readonly dataSource;
    constructor(repo: Repository<Category>, dataSource: DataSource);
    findAllWithCounts(): Promise<CategoryAdminRow[]>;
    findAdminById(id: number): Promise<CategoryAdminRow | null>;
    exists(id: number): Promise<boolean>;
    findParentLinks(): Promise<{
        id: number;
        parentId: number | null;
    }[]>;
    findSlugsStartingWith(prefix: string): Promise<string[]>;
    insert(data: Required<Pick<CategoryWrite, 'name' | 'slug'>> & CategoryWrite): Promise<number>;
    update(id: number, data: CategoryWrite): Promise<void>;
    countChildren(id: number): Promise<number>;
    countProducts(id: number): Promise<number>;
    delete(id: number): Promise<void>;
    private toAdminRow;
}
