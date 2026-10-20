import { toBool } from '../../../utils/db-error.util.js';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Collection } from '../../catalog/models/collection.entity.js';

export interface CollectionAdminRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  productCount: number;
}

export interface CollectionWrite {
  name?: string;
  slug?: string;
  description?: string | null;
  bannerUrl?: string | null;
  isActive?: boolean;
}

interface RawCollectionRow extends Omit<CollectionAdminRow, 'isActive' | 'productCount'> {
  isActive: number;
  productCount: string;
}

const SELECT_WITH_COUNT = `
  SELECT c.id, c.name, c.slug, c.description, c.bannerUrl, c.isActive,
         (SELECT COUNT(*) FROM products p WHERE p.collectionId = c.id) AS productCount
  FROM collections c`;

@Injectable()
export class CollectionAdminRepository {
  constructor(
    @InjectRepository(Collection) private readonly repo: Repository<Collection>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<CollectionAdminRow[]> {
    const rows: RawCollectionRow[] = await this.dataSource.query(`${SELECT_WITH_COUNT} ORDER BY c.name ASC, c.id ASC`);
    return rows.map((row) => this.toRow(row));
  }

  async findById(id: number): Promise<CollectionAdminRow | null> {
    const rows: RawCollectionRow[] = await this.dataSource.query(`${SELECT_WITH_COUNT} WHERE c.id = ?`, [id]);
    return rows[0] ? this.toRow(rows[0]) : null;
  }

  async findSlugsStartingWith(prefix: string): Promise<string[]> {
    const rows: { slug: string }[] = await this.dataSource.query(
      'SELECT slug FROM collections WHERE slug = ? OR slug LIKE ?',
      [prefix, `${prefix.replace(/[\\%_]/g, '\\$&')}-%`],
    );
    return rows.map((row) => row.slug);
  }

  async insert(data: Required<Pick<CollectionWrite, 'name' | 'slug'>> & CollectionWrite): Promise<number> {
    const saved = await this.repo.save(
      this.repo.create({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        bannerUrl: data.bannerUrl ?? null,
        isActive: data.isActive ?? true,
      }),
    );
    return saved.id;
  }

  async update(id: number, data: CollectionWrite): Promise<void> {
    if (Object.keys(data).length) await this.repo.update({ id }, data);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }

  private toRow(row: RawCollectionRow): CollectionAdminRow {
    return { ...row, isActive: toBool(row.isActive), productCount: Number(row.productCount) };
  }
}
