var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, BusinessException, ErrorCode, ValidationException, } from '../../../exceptions/index.js';
import { getDuplicateInfo, isForeignKeyMissingError, isForeignKeyReferencedError, } from '../../../utils/db-error.util.js';
import { resolvePage, toPage } from '../../../utils/pagination.js';
import { persistWithSlug } from '../../../utils/slug.util.js';
import { ProductAdminRepository, } from '../repositories/product-admin.repository.js';
import { ProductImageService } from './product-image.service.js';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_SLUG_LENGTH = 220;
let ProductAdminService = class ProductAdminService {
    products;
    images;
    constructor(products, images) {
        this.products = products;
        this.images = images;
    }
    async list(query) {
        const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const { rows, total } = await this.products.findPage({ q: query.q || undefined, categoryId: query.categoryId, isActive: query.isActive }, request.pageSize, request.offset);
        return toPage(rows, total, request);
    }
    async getDetail(id) {
        const product = await this.products.findById(id);
        if (!product)
            throw this.notFound();
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
    async create(dto) {
        const details = [
            ...this.checkVariantInputs(dto.variants),
        ];
        details.push(...(await this.checkReferences(dto)));
        if (details.length)
            throw new ValidationException(details);
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
                save: (resolvedSlug) => this.products.create({ ...rest, slug: resolvedSlug }, this.toGemstoneWrites(gemstones ?? []), variants.map((variant) => ({
                    sku: variant.sku,
                    size: variant.size,
                    stock: variant.stock ?? 0,
                    isActive: variant.isActive ?? true,
                }))),
            });
            return await this.getDetail(id);
        }
        catch (error) {
            throw this.mapWriteError(error, variants, dto.code);
        }
    }
    async update(id, dto) {
        if (!(await this.products.exists(id)))
            throw this.notFound();
        const details = [
            ...(dto.variants ? this.checkVariantInputs(dto.variants) : []),
            ...(await this.checkReferences(dto)),
        ];
        if (details.length)
            throw new ValidationException(details);
        const { variants, gemstones, ...scalars } = dto;
        const variantPlan = variants ? await this.planVariantSync(id, variants) : undefined;
        try {
            await this.products.update(id, this.stripUndefined(scalars), gemstones ? this.toGemstoneWrites(gemstones) : undefined, variantPlan);
        }
        catch (error) {
            throw this.mapWriteError(error, variants, dto.code);
        }
        return this.getDetail(id);
    }
    async remove(id) {
        if (!(await this.products.exists(id)))
            throw this.notFound();
        if (await this.products.hasOrderItems(id))
            throw this.inUse();
        let publicIds;
        try {
            publicIds = await this.products.remove(id);
        }
        catch (error) {
            if (isForeignKeyReferencedError(error))
                throw this.inUse();
            throw error;
        }
        this.images.scheduleStorageDeletion(publicIds);
    }
    async changeStock(productId, variantId, dto) {
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
            ? await this.products.setStock(productId, variantId, dto.set)
            : await this.products.adjustStock(productId, variantId, dto.delta);
        if (!applied) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, 'Tồn kho không đủ để trừ số lượng này', HttpStatus.CONFLICT);
        }
        const updated = await this.products.findVariant(productId, variantId);
        return { id: variantId, sku: variant.sku, size: variant.size, stock: updated?.stock ?? 0 };
    }
    checkVariantInputs(variants) {
        const details = [];
        const skus = new Set();
        const sizes = new Set();
        variants.forEach((variant, index) => {
            const sku = variant.sku.toLowerCase();
            const size = variant.size.toLowerCase();
            if (skus.has(sku))
                details.push({ field: `variants.${index}.sku`, message: 'SKU bị trùng trong danh sách biến thể' });
            if (sizes.has(size))
                details.push({ field: `variants.${index}.size`, message: 'Size bị trùng trong danh sách biến thể' });
            skus.add(sku);
            sizes.add(size);
        });
        return details;
    }
    async checkReferences(dto) {
        const details = [];
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
    async planVariantSync(productId, items) {
        const existing = await this.products.findVariants(productId);
        const existingById = new Map(existing.map((variant) => [variant.id, variant]));
        const keptIds = new Set();
        const plan = { update: [], create: [], deactivateIds: [] };
        const details = [];
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
        if (details.length)
            throw new ValidationException(details);
        plan.deactivateIds = existing.filter((variant) => variant.isActive && !keptIds.has(variant.id)).map((v) => v.id);
        this.assertSizeSwapSafe(plan, existingById);
        return plan;
    }
    assertSizeSwapSafe(plan, existingById) {
        const incomingSizes = new Map(plan.update.map((item) => [item.size.toLowerCase(), item.id]));
        for (const item of plan.update) {
            const current = existingById.get(item.id);
            if (!current || current.size.toLowerCase() === item.size.toLowerCase())
                continue;
            const holder = [...existingById.values()].find((other) => other.id !== item.id && other.size.toLowerCase() === item.size.toLowerCase());
            if (holder && incomingSizes.get(holder.size.toLowerCase()) === holder.id && !plan.deactivateIds.includes(holder.id)) {
                throw new ValidationException([
                    { field: 'variants', message: 'Không thể hoán đổi size giữa hai biến thể trong một lần sửa, hãy sửa lần lượt' },
                ]);
            }
        }
    }
    toGemstoneWrites(items) {
        return items.map((item) => ({
            gemstoneId: item.gemstoneId,
            quantity: item.quantity ?? 1,
            carat: item.carat ?? null,
            color: item.color ?? null,
            clarity: item.clarity ?? null,
            cut: item.cut ?? null,
        }));
    }
    stripUndefined(scalars) {
        return Object.fromEntries(Object.entries(scalars).filter(([, value]) => value !== undefined));
    }
    mapWriteError(error, variants = [], code) {
        if (error instanceof AppException)
            return error;
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
    slugConflict() {
        return new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
            { field: 'slug', message: 'Slug đã tồn tại' },
        ]);
    }
    inUse() {
        return new BusinessException(ErrorCode.RESOURCE_IN_USE, 'Sản phẩm đã có trong đơn hàng nên không thể xóa. Hãy ẩn sản phẩm (isActive=false) thay vì xóa.', HttpStatus.CONFLICT);
    }
    notFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
    }
};
ProductAdminService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ProductAdminRepository,
        ProductImageService])
], ProductAdminService);
export { ProductAdminService };
//# sourceMappingURL=product-admin.service.js.map