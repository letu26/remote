var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { CacheService } from '../../redis/services/cache.service.js';
import { SettingsRepository } from '../../settings/repositories/settings.repository.js';
import { SITE_INFO_DEFAULTS, SITE_INFO_FIELDS } from '../dtos/site-info.dtos.js';
const CACHE_KEY = 'site-info';
const CACHE_TTL_SECONDS = 300;
const KEY_PREFIX = 'site.';
let SiteInfoService = class SiteInfoService {
    settings;
    cache;
    constructor(settings, cache) {
        this.settings = settings;
        this.cache = cache;
    }
    async get() {
        const cached = await this.cache.get(CACHE_KEY);
        if (cached)
            return cached;
        const values = await this.settings.findByKeys(SITE_INFO_FIELDS.map((field) => KEY_PREFIX + field));
        const info = Object.fromEntries(SITE_INFO_FIELDS.map((field) => [field, values.get(KEY_PREFIX + field) ?? SITE_INFO_DEFAULTS[field]]));
        await this.cache.set(CACHE_KEY, info, CACHE_TTL_SECONDS);
        return info;
    }
    async save(dto) {
        const info = Object.fromEntries(SITE_INFO_FIELDS.map((field) => [field, dto[field]]));
        await this.settings.upsertMany(Object.fromEntries(SITE_INFO_FIELDS.map((field) => [KEY_PREFIX + field, info[field]])));
        await this.cache.delete(CACHE_KEY);
        return info;
    }
};
SiteInfoService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SettingsRepository,
        CacheService])
], SiteInfoService);
export { SiteInfoService };
//# sourceMappingURL=site-info.service.js.map