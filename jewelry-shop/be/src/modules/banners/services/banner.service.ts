import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { ImageCleanupService } from '../../media/services/image-cleanup.service.js';
import type { CreateBannerDto, UpdateBannerDto } from '../dtos/banner.dtos.js';
import { type BannerRow, BannerRepository } from '../repositories/banner.repository.js';

@Injectable()
export class BannerService {
  constructor(
    private readonly banners: BannerRepository,
    private readonly cleanup: ImageCleanupService,
  ) {}

  async listPublic(position?: string) {
    const rows = await this.banners.findActive(position);
    return rows.map(({ id, title, imageUrl, linkUrl, position: pos, sortOrder }) => ({
      id,
      title,
      imageUrl,
      linkUrl,
      position: pos,
      sortOrder,
    }));
  }

  listAll(): Promise<BannerRow[]> {
    return this.banners.findAll();
  }

  async create(dto: CreateBannerDto): Promise<BannerRow> {
    const id = await this.banners.insert({
      title: dto.title,
      imageUrl: dto.imageUrl,
      imagePublicId: dto.imagePublicId,
      linkUrl: dto.linkUrl || null,
      position: dto.position,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });
    return this.getOrFail(id);
  }

  async update(id: number, dto: UpdateBannerDto): Promise<BannerRow> {
    const current = await this.getOrFail(id);
    // Đổi ảnh mà không gửi publicId mới thì publicId cũ không còn đúng: xóa liên kết (ảnh nhập tay).
    const imagePublicId = dto.imageUrl !== undefined && dto.imagePublicId === undefined ? null : dto.imagePublicId;
    await this.banners.update(id, {
      title: dto.title,
      imageUrl: dto.imageUrl,
      imagePublicId,
      linkUrl: dto.linkUrl === undefined ? undefined : dto.linkUrl || null,
      position: dto.position,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });
    const updated = await this.getOrFail(id);
    // Chỉ xóa ảnh cũ trên Cloudinary sau khi ghi DB thành công.
    if (current.imagePublicId && current.imagePublicId !== updated.imagePublicId) {
      this.cleanup.scheduleDeletion([current.imagePublicId]);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    const current = await this.getOrFail(id);
    await this.banners.delete(id);
    this.cleanup.scheduleDeletion([current.imagePublicId]);
  }

  private async getOrFail(id: number): Promise<BannerRow> {
    const banner = await this.banners.findById(id);
    if (!banner) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy banner', HttpStatus.NOT_FOUND);
    return banner;
  }
}
