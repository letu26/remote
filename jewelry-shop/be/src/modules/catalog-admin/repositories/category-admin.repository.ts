import { toBool } from '../../../utils/db-error.util.js';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../../catalog/models/category.entity.js';

export interface CategoryAdminRow {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  childCount: number;
}

export interface CategoryWrite {
  name?: string;
  slug?: string;
  parentId?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface RawCategoryRow extends Omit<CategoryAdminRow, 'isActive' | 'productCount' | 'childCount'> {
  isActive: number;
  productCount: string;
  childCount: string;
}

@Injectable()
export class CategoryAdminRepository {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Toàn bộ danh mục kèm số sản phẩm/số con, bằng một truy vấn. */
  async findAllWithCounts(): Promise<CategoryAdminRow[]> {
    const rows: RawCategoryRow[] = await this.dataSource.query(
      `SELECT c.id, c.name, c.slug, c.parentId, c.sortOrder, c.isActive,
              (SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id) AS productCount,
              (SELECT COUNT(*) FROM categories x WHERE x.parentId = c.id) AS childCount
       FROM categories c
       ORDER BY c.sortOrder ASC, c.name ASC, c.id ASC`,
    );
    return rows.map((row) => this.toAdminRow(row));
  }

  async findAdminById(id: number): Promise<CategoryAdminRow | null> {
    const rows: RawCategoryRow[] = await this.dataSource.query(
      `SELECT c.id, c.name, c.slug, c.parentId, c.sortOrder, c.isActive,
              (SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id) AS productCount,
              (SELECT COUNT(*) FROM categories x WHERE x.parentId = c.id) AS childCount
       FROM categories c WHERE c.id = ?`,
      [id],
    );
    return rows[0] ? this.toAdminRow(rows[0]) : null;
  }

  async exists(id: number): Promise<boolean> {
    return (await this.repo.count({ where: { id } })) > 0;
  }

  /** Quan hệ cha-con của mọi danh mục (để kiểm tra vòng). */
  findParentLinks(): Promise<{ id: number; parentId: number | null }[]> {
    return this.repo.find({ select: { id: true, parentId: true } });
  }

  async findSlugsStartingWith(prefix: string): Promise<string[]> {
    const rows: { slug: string }[] = await this.dataSource.query(
      'SELECT slug FROM categories WHERE slug = ? OR slug LIKE ?',
      [prefix, `${prefix.replace(/[\\%_]/g, '\\$&')}-%`],
    );
    return rows.map((row) => row.slug);
  }

  async insert(data: Required<Pick<CategoryWrite, 'name' | 'slug'>> & CategoryWrite): Promise<number> {
    const saved = await this.repo.save(
      this.repo.create({
        name: data.name,
        slug: data.slug,
        parentId: data.parentId ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      }),
    );
    return saved.id;
  }

  async update(id: number, data: CategoryWrite): Promise<void> {
    if (Object.keys(data).length) await this.repo.update({ id }, data);
  }

  async countChildren(id: number): Promise<number> {
    return this.repo.count({ where: { parentId: id } });
  }

  async countProducts(id: number): Promise<number> {
    const rows: { total: string }[] = await this.dataSource.query(
      'SELECT COUNT(*) AS total FROM products WHERE categoryId = ?',
      [id],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }

  private toAdminRow(row: RawCategoryRow): CategoryAdminRow {
    return {
      ...row,
      isActive: toBool(row.isActive),
      productCount: Number(row.productCount),
      childCount: Number(row.childCount),
    };
  }
}
