import { Repository } from 'typeorm';
import { Province } from '../models/province.entity.js';
import { Ward } from '../models/ward.entity.js';
export interface LocationItem {
    id: number;
    code: number;
    name: string;
}
export declare class LocationRepository {
    private readonly provinces;
    private readonly wards;
    constructor(provinces: Repository<Province>, wards: Repository<Ward>);
    findProvinces(): Promise<LocationItem[]>;
    provinceExists(id: number): Promise<boolean>;
    findWardsByProvince(provinceId: number): Promise<LocationItem[]>;
}
