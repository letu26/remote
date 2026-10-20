import { CatalogCacheRepository } from '../../catalog/repositories/catalog-cache.repository.js';
import type { CreateNamedLookupDto, UpdateNamedLookupDto } from '../dtos/taxonomy-admin.dtos.js';
import { type LookupAdminRow, type LookupKind, LookupAdminRepository } from '../repositories/lookup-admin.repository.js';
export declare class LookupAdminService {
    private readonly lookups;
    private readonly cache;
    constructor(lookups: LookupAdminRepository, cache: CatalogCacheRepository);
    list(kind: LookupKind): Promise<LookupAdminRow[]>;
    create(kind: LookupKind, dto: CreateNamedLookupDto): Promise<LookupAdminRow>;
    update(kind: LookupKind, id: number, dto: UpdateNamedLookupDto): Promise<LookupAdminRow>;
    remove(kind: LookupKind, id: number): Promise<void>;
    private inUse;
    private mapDuplicate;
    private getOrFail;
}
