import { CreateMenuDto, MenuQueryDto, UpdateMenuDto } from '../dtos/menu.dtos.js';
import { MenuService } from '../services/menu.service.js';
export declare class MenuController {
    private readonly service;
    constructor(service: MenuService);
    tree(query: MenuQueryDto): Promise<import("../services/menu.service.js").MenuNode[]>;
}
export declare class MenuAdminController {
    private readonly service;
    constructor(service: MenuService);
    list(): Promise<import("../repositories/menu.repository.js").MenuRow[]>;
    create(dto: CreateMenuDto): Promise<import("../repositories/menu.repository.js").MenuRow>;
    update(id: number, dto: UpdateMenuDto): Promise<import("../repositories/menu.repository.js").MenuRow>;
    remove(id: number): Promise<void>;
}
