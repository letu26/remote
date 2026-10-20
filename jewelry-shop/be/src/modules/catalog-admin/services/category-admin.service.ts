import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { getDuplicateInfo, isForeignKeyReferencedError } from '../../../utils/db-error.util.js';
import { persistWithSlug } from '../../../utils/slug.util.js';
import { CatalogCacheRepository } from '../../catalog/repositories/catalog-cache.repository.js';
import type { CreateCategoryDto, UpdateCategoryDto } from '../dtos/taxonomy-admin.dtos.js';
import { CategoryAdminRepository, type CategoryAdminRow } from '../repositories/category-admin.repository.js';

const MAX_SLUG_LENGTH = 120;
// Bảng này chỉ có một ràng buộc duy nhất (slug) nên mọi lỗi trùng khóa đều là trùng slug.
const isSlugConflict = (error: unknown) => getDuplicateInfo(error)?.table === 'categories';

@Injectable()
export class CategoryAdminService {
  constructor(
    private readonly categories: CategoryAdminRepository,
    private readonly cache: CatalogCacheRepository,
  ) {}

  list(): Promise<CategoryAdminRow[]> {
    return this.categories.findAllWithCounts();
  }

  async create(dto: CreateCategoryDto): Promise<CategoryAdminRow> {
    if (dto.parentId != null) await this.assertParentExists(dto.parentId);
    const id = await persistWithSlug({
      name: dto.name,
      slug: dto.slug,
      maxLength: MAX_SLUG_LENGTH,
      findTaken: (prefix) => this.categories.findSlugsStartingWith(prefix),
      isSlugConflict,
      save: (slug) =>
        this.categories.insert({
          name: dto.name,
          slug,
          parentId: dto.parentId,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        }),
    });
    await this.cache.invalidate('categories');
    return this.getOrFail(id);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<CategoryAdminRow> {
    await this.getOrFail(id);
    if (dto.parentId !== undefined && dto.parentId !== null) {
      await this.assertParentExists(dto.parentId);
      await this.assertNoCycle(id, dto.parentId);
    }
    try {
      await this.categories.update(id, dto);
    } catch (error) {
      if (isSlugConflict(error)) {
        throw new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
          { field: 'slug', message: 'Slug đã tồn tại' },
        ]);
      }
      throw error;
    }
    await this.cache.invalidate('categories');
    return this.getOrFail(id);
  }

  async remove(id: number): Promise<void> {
    const category = await this.getOrFail(id);
    if (category.childCount > 0) {
      throw this.inUse(`Danh mục đang có ${category.childCount} danh mục con`);
    }
    if (category.productCount > 0) {
      throw this.inUse(`Danh mục đang có ${category.productCount} sản phẩm`);
    }
    try {
      await this.categories.delete(id);
    } catch (error) {
      // Có con/sản phẩm được thêm vào đúng lúc xóa: khóa ngoại chặn lại.
      if (isForeignKeyReferencedError(error)) throw this.inUse('Danh mục đang được sử dụng');
      throw error;
    }
    await this.cache.invalidate('categories');
  }

  private inUse(reason: string): BusinessException {
    return new BusinessException(
      ErrorCode.RESOURCE_IN_USE,
      `${reason} nên không thể xóa. Hãy ẩn danh mục (isActive=false) thay vì xóa.`,
      HttpStatus.CONFLICT,
    );
  }

  private async getOrFail(id: number): Promise<CategoryAdminRow> {
    const category = await this.categories.findAdminById(id);
    if (!category) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy danh mục', HttpStatus.NOT_FOUND);
    return category;
  }

  private async assertParentExists(parentId: number): Promise<void> {
    if (!(await this.categories.exists(parentId))) {
      throw new ValidationException([{ field: 'parentId', message: 'Danh mục cha không tồn tại' }]);
    }
  }

  /** parentId không được là chính nó hoặc hậu duệ của nó. */
  private async assertNoCycle(id: number, newParentId: number): Promise<void> {
    const parentOf = new Map((await this.categories.findParentLinks()).map((row) => [row.id, row.parentId]));
    let cursor: number | null | undefined = newParentId;
    const visited = new Set<number>();
    while (cursor != null && !visited.has(cursor)) {
      if (cursor === id) {
        throw new ValidationException([
          { field: 'parentId', message: 'Danh mục cha không được là chính nó hoặc danh mục con của nó' },
        ]);
      }
      visited.add(cursor);
      cursor = parentOf.get(cursor);
    }
  }
}
