import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from '../models/province.entity.js';
import { Ward } from '../models/ward.entity.js';

export interface LocationItem {
  id: number;
  code: number;
  name: string;
}

@Injectable()
export class LocationRepository {
  constructor(
    @InjectRepository(Province) private readonly provinces: Repository<Province>,
    @InjectRepository(Ward) private readonly wards: Repository<Ward>,
  ) {}

  findProvinces(): Promise<LocationItem[]> {
    return this.provinces.find({ select: { id: true, code: true, name: true }, order: { name: 'ASC', id: 'ASC' } });
  }

  async provinceExists(id: number): Promise<boolean> {
    return (await this.provinces.count({ where: { id } })) > 0;
  }

  findWardsByProvince(provinceId: number): Promise<LocationItem[]> {
    return this.wards.find({
      select: { id: true, code: true, name: true },
      where: { provinceId },
      order: { name: 'ASC', id: 'ASC' },
    });
  }
}
