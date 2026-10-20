import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { LocationCacheRepository } from '../repositories/location-cache.repository.js';
import { type LocationItem, LocationRepository } from '../repositories/location.repository.js';

@Injectable()
export class LocationService {
  constructor(
    private readonly locations: LocationRepository,
    private readonly cache: LocationCacheRepository,
  ) {}

  async getProvinces(): Promise<LocationItem[]> {
    const cached = await this.cache.get<LocationItem[]>('provinces');
    if (cached) return cached;
    const items = await this.locations.findProvinces();
    await this.cache.set('provinces', items);
    return items;
  }

  async getWards(provinceId: number): Promise<LocationItem[]> {
    const key = `wards:${provinceId}`;
    const cached = await this.cache.get<LocationItem[]>(key);
    if (cached) return cached;
    if (!(await this.locations.provinceExists(provinceId))) {
      throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy tỉnh/thành', HttpStatus.NOT_FOUND);
    }
    const items = await this.locations.findWardsByProvince(provinceId);
    await this.cache.set(key, items);
    return items;
  }
}
