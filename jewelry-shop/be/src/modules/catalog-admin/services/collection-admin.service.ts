import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { getDuplicateInfo, isForeignKeyReferencedError } from '../../../utils/db-error.util.js';
import { persistWithSlug } from '../../../utils/slug.util.js';
import { CatalogCacheRepository } from '../../catalog/repositories/catalog-cache.repository.js';
import type { CreateCollectionDto, UpdateCollectionDto } from '../dtos/taxonomy-admin.dtos.js';
import { CollectionAdminRepository, type CollectionAdminRow } from '../repositories/collection-admin.repository.js';

const MAX_SLUG_LENGTH = 170;
// Bảng này chỉ có một ràng buộc duy nhất (slug) nên mọi lỗi trùng khóa đều là trùng slug.
const isSlugConflict = (error: unknown) => getDuplicateInfo(error)?.table === 'collections';

@Injectable()
export class CollectionAdminService {
  constructor(
    private readonly collections: CollectionAdminRepository,
    private readonly cache: CatalogCacheRepository,
  ) {}

  list(): Promise<CollectionAdminRow[]> {
    return this.collections.findAll();
  }

  async create(dto: CreateCollectionDto): Promise<CollectionAdminRow> {
    const id = await persistWithSlug({
      name: dto.name,
      slug: dto.slug,
      maxLength: MAX_SLUG_LENGTH,
      findTaken: (prefix) => this.collections.findSlugsStartingWith(prefix),
      isSlugConflict,
      save: (slug) =>
        this.collections.insert({
          name: dto.name,
          slug,
          description: dto.description,
          bannerUrl: dto.bannerUrl,
          isActive: dto.isActive,
        }),
    });
    await this.cache.invalidate('collections');
    return this.getOrFail(id);
  }

  async update(id: number, dto: UpdateCollectionDto): Promise<CollectionAdminRow> {
    await this.getOrFail(id);
    try {
      await this.collections.update(id, dto);
    } catch (error) {
      if (isSlugConflict(error)) {
        throw new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
          { field: 'slug', message: 'Slug đã tồn tại' },
        ]);
      }
      throw error;
    }
    await this.cache.invalidate('collections');
    return this.getOrFail(id);
  }

  async remove(id: number): Promise<void> {
    const collection = await this.getOrFail(id);
    if (collection.productCount > 0) throw this.inUse(collection.productCount);
    try {
      await this.collections.delete(id);
    } catch (error) {
      if (isForeignKeyReferencedError(error)) throw this.inUse(1);
      throw error;
    }
    await this.cache.invalidate('collections');
  }

  private inUse(count: number): BusinessException {
    return new BusinessException(
      ErrorCode.RESOURCE_IN_USE,
      `Bộ sưu tập đang có ${count} sản phẩm nên không thể xóa. Hãy ẩn (isActive=false) thay vì xóa.`,
      HttpStatus.CONFLICT,
    );
  }

  private async getOrFail(id: number): Promise<CollectionAdminRow> {
    const collection = await this.collections.findById(id);
    if (!collection) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy bộ sưu tập', HttpStatus.NOT_FOUND);
    return collection;
  }
}
