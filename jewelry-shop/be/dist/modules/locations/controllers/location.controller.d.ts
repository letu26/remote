import { LocationService } from '../services/location.service.js';
export declare class LocationController {
    private readonly service;
    constructor(service: LocationService);
    provinces(): Promise<import("../repositories/location.repository.js").LocationItem[]>;
    wards(provinceId: number): Promise<import("../repositories/location.repository.js").LocationItem[]>;
}
