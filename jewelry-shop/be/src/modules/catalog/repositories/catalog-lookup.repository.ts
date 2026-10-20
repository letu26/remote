import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../models/category.entity.js';
import { Collection } from '../models/collection.entity.js';
import { Gemstone } from '../models/gemstone.entity.js';
import { Material } from '../models/material.entity.js';
import type { CollectionItem, NamedItem } from '../models/catalog.types.js';

export interface ActiveCategoryRow {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
}

/** Truy vấn dữ liệu tra cứu công khai (chỉ mục đang hiển thị, chỉ cột cần dùng). */
@Injectable()
export class CatalogLookupRepository {
  constructor(
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Material) private readonly materials: Repository<Material>,
    @InjectRepository(Gemstone) private readonly gemstones: Repository<Gemstone>,
    @InjectRepository(Collection) private readonly collections: Repository<Collection>,
  ) {}

  findActiveCategories(): Promise<ActiveCategoryRow[]> {
    return this.categories.find({
      select: { id: true, name: true, slug: true, parentId: true, sortOrder: true },
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC', id: 'ASC' },
    });
  }

  findActiveMaterials(): Promise<NamedItem[]> {
    return this.materials.find({ select: { id: true, name: true }, where: { isActive: true }, order: { name: 'ASC' } });
  }

  findActiveGemstones(): Promise<NamedItem[]> {
    return this.gemstones.find({ select: { id: true, name: true }, where: { isActive: true }, order: { name: 'ASC' } });
  }

  findActiveCollections(): Promise<CollectionItem[]> {
    return this.collections.find({
      select: { id: true, name: true, slug: true, description: true, bannerUrl: true },
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }
}
