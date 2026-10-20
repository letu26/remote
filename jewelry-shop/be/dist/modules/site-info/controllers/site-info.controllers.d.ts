import { SiteInfoDto } from '../dtos/site-info.dtos.js';
import { SiteInfoService } from '../services/site-info.service.js';
export declare class SiteInfoController {
    private readonly service;
    constructor(service: SiteInfoService);
    get(): Promise<import("../dtos/site-info.dtos.js").SiteInfo>;
}
export declare class SiteInfoAdminController {
    private readonly service;
    constructor(service: SiteInfoService);
    get(): Promise<import("../dtos/site-info.dtos.js").SiteInfo>;
    save(dto: SiteInfoDto): Promise<import("../dtos/site-info.dtos.js").SiteInfo>;
}
