import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AppException,
  BusinessException,
  ErrorCode,
  type ErrorDetail,
  ValidationException,
} from '../../../exceptions/index.js';
import {
  getDuplicateInfo,
  isForeignKeyMissingError,
  isForeignKeyReferencedError,
} from '../../../utils/db-error.util.js';
import { type Page, resolvePage, toPage } from '../../../utils/pagination.js';
import { persistWithSlug } from '../../../utils/slug.util.js';
import {
  type AdminProductListQueryDto,
  type CreateProductDto,
  type ProductGemstoneInputDto,
  type ProductVariantInputDto,
  type StockChangeDto,
  type UpdateProductDto,
} from '../dtos/product-admin.dtos.js';
import {
  type AdminProductListRow,
  type AdminVariantRow,
  type GemstoneWrite,
  ProductAdminRepository,
  type ProductScalarWrite,
  type VariantSyncPlan,
} from '../repositories/product-admin.repository.js';
import { ProductImageService } from './product-image.service.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_SLUG_LENGTH = 220;



@Injectable()
export class ProductAdminService {
  constructor(
    private readonly products: ProductAdminRepository,
    private readonly images: ProductImageService,
  ) {}

  async list(query: AdminProductListQueryDto): Promise<Page<AdminProductListRow>> {
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const { rows, total } = await this.products.findPage(
      { q: query.q || undefined, categoryId: query.categoryId, isActive: query.isActive },
      request.pageSize,
      request.offset,
    );
    return toPage(rows, total, request);
  }

  async getDetail(id: number) {
    const product = await this.products.findById(id);
    if (!product) throw this.notFound();
    const [images, variants, gemstones] = await Promise.all([
      this.products.findImages(id),
      this.products.findVariants(id),
      this.products.findGemstones(id),
    ]);
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      slug: product.slug,
      description: product.description,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      materialId: product.materialId,
      collectionId: product.collectionId,
      targetGroup: product.targetGroup,
      weight: product.weight,
      costPrice: product.costPrice,
      price: product.price,
      warrantyInfo: product.warrantyInfo,
      certificate: product.certificate,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      soldCount: product.soldCount,
      avgRating: product.avgRating,
      reviewCount: product.reviewCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      images: images.map(({ id: imageId, url, isPrimary, sortOrder }) => ({ id: imageId, url, isPrimary, sortOrder })),
      variants,
      gemstones,
    };
  }

  async create(dto: CreateProductDto) {
    const details: ErrorDetail[] = [
      ...this.checkVariantInputs(dto.variants),
    ];
    details.push(...(await this.checkReferences(dto)));
    if (details.length) throw new ValidationException(details);

    const { variants, gemstones, slug, ...rest } = dto;
    try {
      const id = await persistWithSlug({
        name: dto.name,
        slug,
        maxLength: MAX_SLUG_LENGTH,
        findTaken: (prefix) => this.products.findSlugsStartingWith(prefix),
        isSlugConflict: (error) => {
          const duplicate = getDuplicateInfo(error);
          return duplicate?.table === 'products' && duplicate.value.toLowerCase() !== dto.code.toLowerCase();
        },
        save: (resolvedSlug) =>
          this.products.create(
            { ...rest, slug: resolvedSlug },
            this.toGemstoneWrites(gemstones ?? []),
            variants.map((variant) => ({
              sku: variant.sku,
              size: variant.size,
              stock: variant.stock ?? 0,
              isActive: variant.isActive ?? true,
            })),
          ),
      });
      return await this.getDetail(id);
    } catch (error) {
      throw this.mapWriteError(error, variants, dto.code);
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    if (!(await this.products.exists(id))) throw this.notFound();

    const details: ErrorDetail[] = [
      ...(dto.variants ? this.checkVariantInputs(dto.variants) : []),
      ...(await this.checkReferences(dto)),
    ];
    if (details.length) throw new ValidationException(details);

    const { variants, gemstones, ...scalars } = dto;
    const variantPlan = variants ? await this.planVariantSync(id, variants) : undefined;
    try {
      await this.products.update(
        id,
        this.stripUndefined(scalars),
        gemstones ? this.toGemstoneWrites(gemstones) : undefined,
        variantPlan,
      );
    } catch (error) {
      throw this.mapWriteError(error, variants, dto.code);
    }
    return this.getDetail(id);
  }

  async remove(id: number): Promise<void> {
    if (!(await this.products.exists(id))) throw this.notFound();
    if (await this.products.hasOrderItems(id)) throw this.inUse();

    let publicIds: string[];
    try {
      publicIds = await this.products.remove(id);
    } catch (error) {
      // Đơn hàng được tạo đúng lúc xóa: khóa ngoại order_items chặn lại.
      if (isForeignKeyReferencedError(error)) throw this.inUse();
      throw error;
    }
    this.images.scheduleStorageDeletion(publicIds);
  }

  async changeStock(productId: number, variantId: number, dto: StockChangeDto) {
    const hasDelta = dto.delta !== undefined;
    const hasSet = dto.set !== undefined;
    if (hasDelta === hasSet) {
      throw new ValidationException([{ field: 'delta', message: 'Chỉ truyền đúng một trong hai: delta hoặc set' }]);
    }
    const variant = await this.products.findVariant(productId, variantId);
    if (!variant) {
      throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy biến thể của sản phẩm', HttpStatus.NOT_FOUND);
    }

    const applied = hasSet
      ? await this.products.setStock(productId, variantId, dto.set as number)
      : await this.products.adjustStock(productId, variantId, dto.delta as number);
    if (!applied) {
      throw new BusinessException(
        ErrorCode.INSUFFICIENT_STOCK,
        'Tồn kho không đủ để trừ số lượng này',
        HttpStatus.CONFLICT,
      );
    }
    const updated = await this.products.findVariant(productId, variantId);
    return { id: variantId, sku: variant.sku, size: variant.size, stock: updated?.stock ?? 0 };
  }

  // ---------- Quy tắc nghiệp vụ ----------

  /** sku và size không được trùng nhau trong cùng danh sách gửi lên. */
  private checkVariantInputs(variants: ProductVariantInputDto[]): ErrorDetail[] {
    const details: ErrorDetail[] = [];
    const skus = new Set<string>();
    const sizes = new Set<string>();
    variants.forEach((variant, index) => {
      const sku = variant.sku.toLowerCase();
      const size = variant.size.toLowerCase();
      if (skus.has(sku)) details.push({ field: `variants.${index}.sku`, message: 'SKU bị trùng trong danh sách biến thể' });
      if (sizes.has(size)) details.push({ field: `variants.${index}.size`, message: 'Size bị trùng trong danh sách biến thể' });
      skus.add(sku);
      sizes.add(size);
    });
    return details;
  }

  private async checkReferences(
    dto: Pick<UpdateProductDto, 'categoryId' | 'materialId' | 'collectionId' | 'gemstones'>,
  ): Promise<ErrorDetail[]> {
    const details: ErrorDetail[] = [];
    if (dto.categoryId !== undefined && !(await this.products.categoryExists(dto.categoryId))) {
      details.push({ field: 'categoryId', message: 'Danh mục không tồn tại' });
    }
    if (dto.materialId != null && !(await this.products.materialExists(dto.materialId))) {
      details.push({ field: 'materialId', message: 'Chất liệu không tồn tại' });
    }
    if (dto.collectionId != null && !(await this.products.collectionExists(dto.collectionId))) {
      details.push({ field: 'collectionId', message: 'Bộ sưu tập không tồn tại' });
    }
    if (dto.gemstones?.length) {
      const existing = await this.products.findExistingGemstoneIds([...new Set(dto.gemstones.map((g) => g.gemstoneId))]);
      dto.gemstones.forEach((item, index) => {
        if (!existing.has(item.gemstoneId)) {
          details.push({ field: `gemstones.${index}.gemstoneId`, message: 'Loại đá không tồn tại' });
        }
      });
    }
    return details;
  }

  /** Đối chiếu danh sách biến thể gửi lên với biến thể hiện có để ra kế hoạch cập nhật/tạo/ẩn. */
  private async planVariantSync(productId: number, items: ProductVariantInputDto[]): Promise<VariantSyncPlan> {
    const existing = await this.products.findVariants(productId);
    const existingById = new Map(existing.map((variant) => [variant.id, variant]));
    const keptIds = new Set<number>();
    const plan: VariantSyncPlan = { update: [], create: [], deactivateIds: [] };
    const details: ErrorDetail[] = [];

    items.forEach((item, index) => {
      if (item.id === undefined) {
        plan.create.push({ sku: item.sku, size: item.size, stock: item.stock ?? 0, isActive: item.isActive ?? true });
        return;
      }
      if (!existingById.has(item.id)) {
        details.push({ field: `variants.${index}.id`, message: 'Biến thể không thuộc sản phẩm này' });
        return;
      }
      keptIds.add(item.id);
      plan.update.push({ id: item.id, sku: item.sku, size: item.size, isActive: item.isActive });
    });
    if (details.length) throw new ValidationException(details);

    plan.deactivateIds = existing.filter((variant) => variant.isActive && !keptIds.has(variant.id)).map((v) => v.id);
    this.assertSizeSwapSafe(plan, existingById);
    return plan;
  }

  /** Đổi size qua lại giữa hai biến thể sẽ vướng ràng buộc duy nhất khi cập nhật tuần tự; báo lỗi rõ thay vì 500. */
  private assertSizeSwapSafe(plan: VariantSyncPlan, existingById: Map<number, AdminVariantRow>): void {
    const incomingSizes = new Map(plan.update.map((item) => [item.size.toLowerCase(), item.id]));
    for (const item of plan.update) {
      const current = existingById.get(item.id);
      if (!current || current.size.toLowerCase() === item.size.toLowerCase()) continue;
      const holder = [...existingById.values()].find(
        (other) => other.id !== item.id && other.size.toLowerCase() === item.size.toLowerCase(),
      );
      if (holder && incomingSizes.get(holder.size.toLowerCase()) === holder.id && !plan.deactivateIds.includes(holder.id)) {
        throw new ValidationException([
          { field: 'variants', message: 'Không thể hoán đổi size giữa hai biến thể trong một lần sửa, hãy sửa lần lượt' },
        ]);
      }
    }
  }

  private toGemstoneWrites(items: ProductGemstoneInputDto[]): GemstoneWrite[] {
    return items.map((item) => ({
      gemstoneId: item.gemstoneId,
      quantity: item.quantity ?? 1,
      carat: item.carat ?? null,
      color: item.color ?? null,
      clarity: item.clarity ?? null,
      cut: item.cut ?? null,
    }));
  }

  private stripUndefined(scalars: ProductScalarWrite): ProductScalarWrite {
    return Object.fromEntries(Object.entries(scalars).filter(([, value]) => value !== undefined)) as ProductScalarWrite;
  }

  /**
   * Đổi lỗi DB (trùng khóa, khóa ngoại) thành lỗi nghiệp vụ đúng mã. Xác định cột trùng bằng bảng + giá trị
   * (tên chỉ mục trong DB có thể là mã băm), nên cần code/sku mà request vừa gửi.
   */
  private mapWriteError(error: unknown, variants: ProductVariantInputDto[] = [], code?: string): unknown {
    if (error instanceof AppException) return error;
    const duplicate = getDuplicateInfo(error);
    if (duplicate) {
      const value = duplicate.value.toLowerCase();
      if (duplicate.table === 'products') {
        if (code && value === code.toLowerCase()) {
          return new BusinessException(ErrorCode.PRODUCT_CODE_ALREADY_EXISTS, 'Mã sản phẩm đã tồn tại', HttpStatus.CONFLICT, undefined, [
            { field: 'code', message: 'Mã sản phẩm đã tồn tại' },
          ]);
        }
        return this.slugConflict();
      }
      if (duplicate.table === 'product_variants') {
        const index = variants.findIndex((variant) => variant.sku.toLowerCase() === value);
        if (index >= 0) {
          return new BusinessException(ErrorCode.SKU_ALREADY_EXISTS, 'SKU đã tồn tại', HttpStatus.CONFLICT, undefined, [
            { field: `variants[${index}].sku`, message: 'SKU đã tồn tại' },
          ]);
        }
        return new ValidationException([{ field: 'variants', message: 'Size bị trùng trong cùng sản phẩm' }]);
      }
    }
    if (isForeignKeyMissingError(error)) {
      return new ValidationException([{ field: 'categoryId', message: 'Danh mục, chất liệu, bộ sưu tập hoặc loại đá không còn tồn tại' }]);
    }
    return error;
  }

  private slugConflict(): BusinessException {
    return new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
      { field: 'slug', message: 'Slug đã tồn tại' },
    ]);
  }

  private inUse(): BusinessException {
    return new BusinessException(
      ErrorCode.RESOURCE_IN_USE,
      'Sản phẩm đã có trong đơn hàng nên không thể xóa. Hãy ẩn sản phẩm (isActive=false) thay vì xóa.',
      HttpStatus.CONFLICT,
    );
  }

  private notFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
  }
}
