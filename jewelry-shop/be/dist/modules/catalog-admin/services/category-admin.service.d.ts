import { CatalogCacheRepository } from '../../catalog/repositories/catalog-cache.repository.js';
import type { CreateCategoryDto, UpdateCategoryDto } from '../dtos/taxonomy-admin.dtos.js';
import { CategoryAdminRepository, type CategoryAdminRow } from '../repositories/category-admin.repository.js';
export declare class CategoryAdminService {
    private readonly categories;
    private readonly cache;
    constructor(categories: CategoryAdminRepository, cache: CatalogCacheRepository);
    list(): Promise<CategoryAdminRow[]>;
    create(dto: CreateCategoryDto): Promise<CategoryAdminRow>;
    update(id: number, dto: UpdateCategoryDto): Promise<CategoryAdminRow>;
    remove(id: number): Promise<void>;
    private inUse;
    private getOrFail;
    private assertParentExists;
    private assertNoCycle;
}
