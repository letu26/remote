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
import { BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { resolvePage, toPage } from '../../../utils/pagination.js';
import { PromotionAdminRepository } from '../repositories/promotion-admin.repository.js';
import { computePromotionStatus } from './promotion-status.js';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
let PromotionAdminService = class PromotionAdminService {
    promotions;
    constructor(promotions) {
        this.promotions = promotions;
    }
    async list(query) {
        const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const now = new Date();
        const { rows, total } = await this.promotions.findPage({ q: query.q || undefined, status: query.status, productId: query.productId }, request.pageSize, request.offset, now);
        const page = toPage(rows.map((row) => this.toItem(row, now)), total, request);
        return page;
    }
    async create(dto) {
        const startsAt = new Date(dto.startsAt);
        const endsAt = new Date(dto.endsAt);
        if (startsAt.getTime() >= endsAt.getTime()) {
            throw new ValidationException([{ field: 'endsAt', message: 'Thời gian kết thúc phải sau thời gian bắt đầu' }]);
        }
        const existing = await this.promotions.findExistingProductIds(dto.productIds);
        const missing = dto.productIds.filter((id) => !existing.has(id));
        if (missing.length) {
            throw new ValidationException([{ field: 'productIds', message: `Sản phẩm không tồn tại: ${missing.join(', ')}` }]);
        }
        const ids = await this.promotions.create({
            name: dto.name,
            productIds: dto.productIds,
            discountPercent: dto.discountPercent,
            startsAt,
            endsAt,
            isActive: dto.isActive ?? true,
        });
        const now = new Date();
        const rows = await this.promotions.findByIds(ids);
        return { created: rows.length, items: rows.map((row) => this.toItem(row, now)) };
    }
    async update(id, dto) {
        const current = await this.getOrFail(id);
        const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
        const endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;
        if (startsAt.getTime() >= endsAt.getTime()) {
            throw new ValidationException([{ field: 'endsAt', message: 'Thời gian kết thúc phải sau thời gian bắt đầu' }]);
        }
        await this.promotions.update(id, {
            name: dto.name,
            discountPercent: dto.discountPercent,
            startsAt: dto.startsAt ? startsAt : undefined,
            endsAt: dto.endsAt ? endsAt : undefined,
            isActive: dto.isActive,
        });
        return this.toItem(await this.getOrFail(id), new Date());
    }
    async remove(id) {
        await this.getOrFail(id);
        await this.promotions.delete(id);
    }
    toItem(row, now) {
        return { ...row, status: computePromotionStatus(row, now) };
    }
    async getOrFail(id) {
        const row = await this.promotions.findById(id);
        if (!row)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy khuyến mại', HttpStatus.NOT_FOUND);
        return row;
    }
};
PromotionAdminService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PromotionAdminRepository])
], PromotionAdminService);
export { PromotionAdminService };
//# sourceMappingURL=promotion-admin.service.js.map