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
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { ImageCleanupService } from '../../media/services/image-cleanup.service.js';
import { BannerRepository } from '../repositories/banner.repository.js';
let BannerService = class BannerService {
    banners;
    cleanup;
    constructor(banners, cleanup) {
        this.banners = banners;
        this.cleanup = cleanup;
    }
    async listPublic(position) {
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
    listAll() {
        return this.banners.findAll();
    }
    async create(dto) {
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
    async update(id, dto) {
        const current = await this.getOrFail(id);
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
        if (current.imagePublicId && current.imagePublicId !== updated.imagePublicId) {
            this.cleanup.scheduleDeletion([current.imagePublicId]);
        }
        return updated;
    }
    async remove(id) {
        const current = await this.getOrFail(id);
        await this.banners.delete(id);
        this.cleanup.scheduleDeletion([current.imagePublicId]);
    }
    async getOrFail(id) {
        const banner = await this.banners.findById(id);
        if (!banner)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy banner', HttpStatus.NOT_FOUND);
        return banner;
    }
};
BannerService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [BannerRepository,
        ImageCleanupService])
], BannerService);
export { BannerService };
//# sourceMappingURL=banner.service.js.map