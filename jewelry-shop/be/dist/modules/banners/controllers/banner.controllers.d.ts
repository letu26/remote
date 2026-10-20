import { BannerQueryDto, CreateBannerDto, UpdateBannerDto } from '../dtos/banner.dtos.js';
import { BannerService } from '../services/banner.service.js';
export declare class BannerController {
    private readonly service;
    constructor(service: BannerService);
    list(query: BannerQueryDto): Promise<{
        id: number;
        title: string;
        imageUrl: string;
        linkUrl: string | null;
        position: string;
        sortOrder: number;
    }[]>;
}
export declare class BannerAdminController {
    private readonly service;
    constructor(service: BannerService);
    list(): Promise<import("../repositories/banner.repository.js").BannerRow[]>;
    create(dto: CreateBannerDto): Promise<import("../repositories/banner.repository.js").BannerRow>;
    update(id: number, dto: UpdateBannerDto): Promise<import("../repositories/banner.repository.js").BannerRow>;
    remove(id: number): Promise<void>;
}
