import { CacheService } from '../../redis/services/cache.service.js';
import type { CreateMenuDto, MenuPlacement, UpdateMenuDto } from '../dtos/menu.dtos.js';
import { type MenuRow, MenuRepository } from '../repositories/menu.repository.js';
export interface MenuNode {
    id: number;
    label: string;
    url: string;
    children: {
        id: number;
        label: string;
        url: string;
    }[];
}
export declare class MenuService {
    private readonly menus;
    private readonly cache;
    constructor(menus: MenuRepository, cache: CacheService);
    getTree(placement?: MenuPlacement): Promise<MenuNode[]>;
    listAll(): Promise<MenuRow[]>;
    create(dto: CreateMenuDto): Promise<MenuRow>;
    update(id: number, dto: UpdateMenuDto): Promise<MenuRow>;
    remove(id: number): Promise<void>;
    private assertValidParent;
    private invalidate;
    private invalid;
    private hasChildren;
    private notFound;
    private getOrFail;
}
