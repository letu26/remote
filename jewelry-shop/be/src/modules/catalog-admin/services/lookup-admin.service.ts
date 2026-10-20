import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { getDuplicateInfo, isForeignKeyReferencedError } from '../../../utils/db-error.util.js';
import { CatalogCacheRepository } from '../../catalog/repositories/catalog-cache.repository.js';
import type { CreateNamedLookupDto, UpdateNamedLookupDto } from '../dtos/taxonomy-admin.dtos.js';
import { type LookupAdminRow, type LookupKind, LookupAdminRepository } from '../repositories/lookup-admin.repository.js';

const LABELS: Record<LookupKind, string> = { materials: 'Chất liệu', gemstones: 'Loại đá' };

/** Quản trị chất liệu và loại đá (cùng nghiệp vụ, khác nhãn). */
@Injectable()
export class LookupAdminService {
  constructor(
    private readonly lookups: LookupAdminRepository,
    private readonly cache: CatalogCacheRepository,
  ) {}

  list(kind: LookupKind): Promise<LookupAdminRow[]> {
    return this.lookups.findAll(kind);
  }

  async create(kind: LookupKind, dto: CreateNamedLookupDto): Promise<LookupAdminRow> {
    let id: number;
    try {
      id = await this.lookups.insert(kind, dto.name, dto.isActive ?? true);
    } catch (error) {
      throw this.mapDuplicate(kind, error);
    }
    await this.cache.invalidate(kind);
    return this.getOrFail(kind, id);
  }

  async update(kind: LookupKind, id: number, dto: UpdateNamedLookupDto): Promise<LookupAdminRow> {
    await this.getOrFail(kind, id);
    try {
      await this.lookups.update(kind, id, dto);
    } catch (error) {
      throw this.mapDuplicate(kind, error);
    }
    await this.cache.invalidate(kind);
    return this.getOrFail(kind, id);
  }

  async remove(kind: LookupKind, id: number): Promise<void> {
    const item = await this.getOrFail(kind, id);
    if (item.productCount > 0) throw this.inUse(kind, item.productCount);
    try {
      await this.lookups.delete(kind, id);
    } catch (error) {
      if (isForeignKeyReferencedError(error)) throw this.inUse(kind, 1);
      throw error;
    }
    await this.cache.invalidate(kind);
  }

  private inUse(kind: LookupKind, count: number): BusinessException {
    return new BusinessException(
      ErrorCode.RESOURCE_IN_USE,
      `${LABELS[kind]} đang được ${count} sản phẩm sử dụng nên không thể xóa. Hãy ẩn (isActive=false) thay vì xóa.`,
      HttpStatus.CONFLICT,
    );
  }

  private mapDuplicate(kind: LookupKind, error: unknown): unknown {
    if (getDuplicateInfo(error) === null) return error;
    return new BusinessException(ErrorCode.NAME_ALREADY_EXISTS, `${LABELS[kind]} đã tồn tại`, HttpStatus.CONFLICT, undefined, [
      { field: 'name', message: `${LABELS[kind]} đã tồn tại` },
    ]);
  }

  private async getOrFail(kind: LookupKind, id: number): Promise<LookupAdminRow> {
    const item = await this.lookups.findById(kind, id);
    if (!item) throw new BusinessException(ErrorCode.NOT_FOUND, `Không tìm thấy ${LABELS[kind].toLowerCase()}`, HttpStatus.NOT_FOUND);
    return item;
  }
}
