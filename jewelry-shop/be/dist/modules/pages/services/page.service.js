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
import { getDuplicateInfo } from '../../../utils/db-error.util.js';
import { PageRepository } from '../repositories/page.repository.js';
export const RESERVED_PAGE_SLUGS = [
    've-chung-toi',
    'chinh-sach-bao-hanh',
    'chinh-sach-doi-tra',
    'chinh-sach-giao-hang',
    'dieu-khoan-su-dung',
    'huong-dan-do-size',
];
const isReserved = (slug) => RESERVED_PAGE_SLUGS.includes(slug);
const isSlugConflict = (error) => getDuplicateInfo(error)?.table === 'pages';
let PageService = class PageService {
    pages;
    constructor(pages) {
        this.pages = pages;
    }
    listPublic() {
        return this.pages.findActiveSummaries();
    }
    async getPublic(slug) {
        const page = await this.pages.findActiveBySlug(slug);
        if (!page)
            throw this.notFound();
        return { slug: page.slug, title: page.title, content: page.content, updatedAt: page.updatedAt };
    }
    async listAdmin() {
        const rows = await this.pages.findAll();
        return rows.map((row) => this.toAdmin(row));
    }
    async getAdmin(id) {
        return this.toAdmin(await this.getOrFail(id));
    }
    async create(dto) {
        let id;
        try {
            id = await this.pages.insert({ slug: dto.slug, title: dto.title, content: dto.content, isActive: dto.isActive });
        }
        catch (error) {
            throw isSlugConflict(error) ? this.slugConflict() : error;
        }
        return this.getAdmin(id);
    }
    async update(id, dto) {
        const current = await this.getOrFail(id);
        if (dto.slug !== undefined && dto.slug !== current.slug && isReserved(current.slug)) {
            throw this.reserved('Trang hệ thống không được đổi slug');
        }
        try {
            await this.pages.update(id, dto);
        }
        catch (error) {
            throw isSlugConflict(error) ? this.slugConflict() : error;
        }
        return this.getAdmin(id);
    }
    async remove(id) {
        const current = await this.getOrFail(id);
        if (isReserved(current.slug))
            throw this.reserved('Trang hệ thống không được xóa, hãy ẩn trang nếu không muốn hiển thị');
        await this.pages.delete(id);
    }
    toAdmin(page) {
        return {
            id: page.id,
            slug: page.slug,
            title: page.title,
            content: page.content,
            isActive: page.isActive,
            isReserved: isReserved(page.slug),
            updatedAt: page.updatedAt,
        };
    }
    async getOrFail(id) {
        const page = await this.pages.findById(id);
        if (!page)
            throw this.notFound();
        return page;
    }
    slugConflict() {
        return new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
            { field: 'slug', message: 'Slug đã tồn tại' },
        ]);
    }
    reserved(message) {
        return new BusinessException(ErrorCode.RESERVED_PAGE, message, HttpStatus.CONFLICT);
    }
    notFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy trang', HttpStatus.NOT_FOUND);
    }
};
PageService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PageRepository])
], PageService);
export { PageService };
//# sourceMappingURL=page.service.js.map