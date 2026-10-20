import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { isForeignKeyReferencedError } from '../../../utils/db-error.util.js';
import { CacheService } from '../../redis/services/cache.service.js';
import type { CreateMenuDto, MenuPlacement, UpdateMenuDto } from '../dtos/menu.dtos.js';
import { type MenuRow, type MenuTransaction, MenuRepository } from '../repositories/menu.repository.js';

const CACHE_TTL_SECONDS = 300;
const cacheKey = (placement: string) => `menus:${placement}`;

export interface MenuNode {
  id: number;
  label: string;
  url: string;
  children: { id: number; label: string; url: string }[];
}

@Injectable()
export class MenuService {
  constructor(
    private readonly menus: MenuRepository,
    private readonly cache: CacheService,
  ) {}

  /** Cây 2 cấp công khai; mục gốc ẩn thì con cũng ẩn. */
  async getTree(placement: MenuPlacement = 'header'): Promise<MenuNode[]> {
    const cached = await this.cache.get<MenuNode[]>(cacheKey(placement));
    if (cached) return cached;
    const rows = await this.menus.findActiveByPlacement(placement);
    const roots = rows.filter((row) => row.parentId === null);
    const tree = roots.map((root) => ({
      id: root.id,
      label: root.label,
      url: root.url,
      children: rows
        .filter((row) => row.parentId === root.id)
        .map(({ id, label, url }) => ({ id, label, url })),
    }));
    await this.cache.set(cacheKey(placement), tree, CACHE_TTL_SECONDS);
    return tree;
  }

  listAll(): Promise<MenuRow[]> {
    return this.menus.findAll();
  }

  async create(dto: CreateMenuDto): Promise<MenuRow> {
    const placement = dto.placement ?? 'header';
    const id = await this.menus.runInTransaction(async (tx) => {
      if (dto.parentId != null) await this.assertValidParent(tx, dto.parentId, placement);
      return tx.insert({
        label: dto.label,
        url: dto.url,
        parentId: dto.parentId ?? null,
        placement,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      });
    });
    await this.invalidate();
    return this.getOrFail(id);
  }

  async update(id: number, dto: UpdateMenuDto): Promise<MenuRow> {
    await this.menus.runInTransaction(async (tx) => {
      const current = await tx.lock(id);
      if (!current) throw this.notFound();

      const parentId = dto.parentId === undefined ? current.parentId : dto.parentId;
      const placement = dto.placement ?? current.placement;

      if (parentId !== null) {
        if (parentId === id) throw this.invalid('parentId', 'Một mục không thể là con của chính nó');
        // Mục đang có con không được gán cha (sẽ vượt 2 cấp).
        if (dto.parentId !== undefined && (await tx.countChildren(id)) > 0) {
          throw this.invalid('parentId', 'Mục đang có mục con nên không thể trở thành mục con (tối đa 2 cấp)');
        }
        await this.assertValidParent(tx, parentId, placement);
      }

      await tx.update(id, {
        label: dto.label,
        url: dto.url,
        parentId: dto.parentId,
        placement: dto.placement,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      });
      // Đổi vị trí của mục gốc thì áp dụng cho cả mục con trong cùng transaction.
      if (parentId === null && placement !== current.placement) await tx.setChildrenPlacement(id, placement);
    });
    await this.invalidate();
    return this.getOrFail(id);
  }

  async remove(id: number): Promise<void> {
    await this.getOrFail(id);
    if ((await this.menus.countChildren(id)) > 0) throw this.hasChildren();
    try {
      await this.menus.delete(id);
    } catch (error) {
      if (isForeignKeyReferencedError(error)) throw this.hasChildren();
      throw error;
    }
    await this.invalidate();
  }

  /** Cha phải tồn tại, là mục gốc và cùng vị trí. */
  private async assertValidParent(tx: MenuTransaction, parentId: number, placement: string): Promise<void> {
    const parent = await tx.lock(parentId);
    if (!parent) throw this.invalid('parentId', 'Mục cha không tồn tại');
    if (parent.parentId !== null) throw this.invalid('parentId', 'Mục cha phải là mục gốc (tối đa 2 cấp)');
    if (parent.placement !== placement) throw this.invalid('parentId', 'Mục cha phải cùng vị trí hiển thị');
  }

  private invalidate(): Promise<void> {
    return this.cache.delete(cacheKey('header'), cacheKey('footer'));
  }

  private invalid(field: string, message: string): ValidationException {
    return new ValidationException([{ field, message }]);
  }

  private hasChildren(): BusinessException {
    return new BusinessException(
      ErrorCode.RESOURCE_IN_USE,
      'Mục menu đang có mục con, hãy xóa các mục con trước',
      HttpStatus.CONFLICT,
    );
  }

  private notFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy mục menu', HttpStatus.NOT_FOUND);
  }

  private async getOrFail(id: number): Promise<MenuRow> {
    const menu = await this.menus.findById(id);
    if (!menu) throw this.notFound();
    return menu;
  }
}
