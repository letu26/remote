import { CacheService } from '../../redis/services/cache.service.js';
import { SettingsRepository } from '../../settings/repositories/settings.repository.js';
import { type SiteInfo, type SiteInfoDto } from '../dtos/site-info.dtos.js';
export declare class SiteInfoService {
    private readonly settings;
    private readonly cache;
    constructor(settings: SettingsRepository, cache: CacheService);
    get(): Promise<SiteInfo>;
    save(dto: SiteInfoDto): Promise<SiteInfo>;
}
