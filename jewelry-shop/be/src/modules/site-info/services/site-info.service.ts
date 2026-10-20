import { Injectable } from '@nestjs/common';
import { CacheService } from '../../redis/services/cache.service.js';
import { SettingsRepository } from '../../settings/repositories/settings.repository.js';
import { SITE_INFO_DEFAULTS, SITE_INFO_FIELDS, type SiteInfo, type SiteInfoDto } from '../dtos/site-info.dtos.js';

const CACHE_KEY = 'site-info';
const CACHE_TTL_SECONDS = 300;
const KEY_PREFIX = 'site.';

/** Thông tin cửa hàng trong site_settings (khóa `site.<tên>`, whitelist theo SITE_INFO_FIELDS). */
@Injectable()
export class SiteInfoService {
  constructor(
    private readonly settings: SettingsRepository,
    private readonly cache: CacheService,
  ) {}

  async get(): Promise<SiteInfo> {
    const cached = await this.cache.get<SiteInfo>(CACHE_KEY);
    if (cached) return cached;
    const values = await this.settings.findByKeys(SITE_INFO_FIELDS.map((field) => KEY_PREFIX + field));
    const info = Object.fromEntries(
      SITE_INFO_FIELDS.map((field) => [field, values.get(KEY_PREFIX + field) ?? SITE_INFO_DEFAULTS[field]]),
    ) as SiteInfo;
    await this.cache.set(CACHE_KEY, info, CACHE_TTL_SECONDS);
    return info;
  }

  async save(dto: SiteInfoDto): Promise<SiteInfo> {
    // Chỉ lấy đúng các khóa trong whitelist; khóa lạ không bao giờ được ghi.
    const info = Object.fromEntries(SITE_INFO_FIELDS.map((field) => [field, dto[field]])) as SiteInfo;
    await this.settings.upsertMany(Object.fromEntries(SITE_INFO_FIELDS.map((field) => [KEY_PREFIX + field, info[field]])));
    await this.cache.delete(CACHE_KEY);
    return info;
  }
}
