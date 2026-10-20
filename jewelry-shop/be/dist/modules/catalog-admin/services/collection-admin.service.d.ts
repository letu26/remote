import { CatalogCacheRepository } from '../../catalog/repositories/catalog-cache.repository.js';
import type { CreateCollectionDto, UpdateCollectionDto } from '../dtos/taxonomy-admin.dtos.js';
import { CollectionAdminRepository, type CollectionAdminRow } from '../repositories/collection-admin.repository.js';
export declare class CollectionAdminService {
    private readonly collections;
    private readonly cache;
    constructor(collections: CollectionAdminRepository, cache: CatalogCacheRepository);
    list(): Promise<CollectionAdminRow[]>;
    create(dto: CreateCollectionDto): Promise<CollectionAdminRow>;
    update(id: number, dto: UpdateCollectionDto): Promise<CollectionAdminRow>;
    remove(id: number): Promise<void>;
    private inUse;
    private getOrFail;
}
