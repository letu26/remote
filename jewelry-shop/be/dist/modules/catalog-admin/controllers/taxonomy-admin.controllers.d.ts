import { CreateCategoryDto, CreateCollectionDto, CreateNamedLookupDto, UpdateCategoryDto, UpdateCollectionDto, UpdateNamedLookupDto } from '../dtos/taxonomy-admin.dtos.js';
import { CategoryAdminService } from '../services/category-admin.service.js';
import { CollectionAdminService } from '../services/collection-admin.service.js';
import { LookupAdminService } from '../services/lookup-admin.service.js';
export declare class CategoryAdminController {
    private readonly service;
    constructor(service: CategoryAdminService);
    list(): Promise<import("../repositories/category-admin.repository.js").CategoryAdminRow[]>;
    create(dto: CreateCategoryDto): Promise<import("../repositories/category-admin.repository.js").CategoryAdminRow>;
    update(id: number, dto: UpdateCategoryDto): Promise<import("../repositories/category-admin.repository.js").CategoryAdminRow>;
    remove(id: number): Promise<void>;
}
export declare class MaterialAdminController {
    private readonly service;
    constructor(service: LookupAdminService);
    list(): Promise<import("../repositories/lookup-admin.repository.js").LookupAdminRow[]>;
    create(dto: CreateNamedLookupDto): Promise<import("../repositories/lookup-admin.repository.js").LookupAdminRow>;
    update(id: number, dto: UpdateNamedLookupDto): Promise<import("../repositories/lookup-admin.repository.js").LookupAdminRow>;
    remove(id: number): Promise<void>;
}
export declare class GemstoneAdminController {
    private readonly service;
    constructor(service: LookupAdminService);
    list(): Promise<import("../repositories/lookup-admin.repository.js").LookupAdminRow[]>;
    create(dto: CreateNamedLookupDto): Promise<import("../repositories/lookup-admin.repository.js").LookupAdminRow>;
    update(id: number, dto: UpdateNamedLookupDto): Promise<import("../repositories/lookup-admin.repository.js").LookupAdminRow>;
    remove(id: number): Promise<void>;
}
export declare class CollectionAdminController {
    private readonly service;
    constructor(service: CollectionAdminService);
    list(): Promise<import("../repositories/collection-admin.repository.js").CollectionAdminRow[]>;
    create(dto: CreateCollectionDto): Promise<import("../repositories/collection-admin.repository.js").CollectionAdminRow>;
    update(id: number, dto: UpdateCollectionDto): Promise<import("../repositories/collection-admin.repository.js").CollectionAdminRow>;
    remove(id: number): Promise<void>;
}
