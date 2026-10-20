import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { type Page, resolvePage, toPage } from '../../../utils/pagination.js';
import type { CreatePromotionDto, PromotionListQueryDto, UpdatePromotionDto } from '../dtos/promotion.dtos.js';
import { type PromotionRow, PromotionAdminRepository } from '../repositories/promotion-admin.repository.js';
import { computePromotionStatus } from './promotion-status.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class PromotionAdminService {
  constructor(private readonly promotions: PromotionAdminRepository) {}

  async list(query: PromotionListQueryDto) {
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const now = new Date();
    const { rows, total } = await this.promotions.findPage(
      { q: query.q || undefined, status: query.status, productId: query.productId },
      request.pageSize,
      request.offset,
      now,
    );
    const page: Page<unknown> = toPage(
      rows.map((row) => this.toItem(row, now)),
      total,
      request,
    );
    return page;
  }

  async create(dto: CreatePromotionDto) {
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

  async update(id: number, dto: UpdatePromotionDto) {
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

  async remove(id: number): Promise<void> {
    await this.getOrFail(id);
    await this.promotions.delete(id);
  }

  private toItem(row: PromotionRow, now: Date) {
    return { ...row, status: computePromotionStatus(row, now) };
  }

  private async getOrFail(id: number): Promise<PromotionRow> {
    const row = await this.promotions.findById(id);
    if (!row) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy khuyến mại', HttpStatus.NOT_FOUND);
    return row;
  }
}
