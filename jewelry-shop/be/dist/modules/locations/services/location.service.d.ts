import { LocationCacheRepository } from '../repositories/location-cache.repository.js';
import { type LocationItem, LocationRepository } from '../repositories/location.repository.js';
export declare class LocationService {
    private readonly locations;
    private readonly cache;
    constructor(locations: LocationRepository, cache: LocationCacheRepository);
    getProvinces(): Promise<LocationItem[]>;
    getWards(provinceId: number): Promise<LocationItem[]>;
}
