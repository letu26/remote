import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { getDuplicateInfo } from '../../../utils/db-error.util.js';
import type { CreatePageDto, UpdatePageDto } from '../dtos/page.dtos.js';
import { type PageRow, PageRepository } from '../repositories/page.repository.js';

/** Trang hệ thống: slug dành riêng, không xóa, không đổi slug. */
export const RESERVED_PAGE_SLUGS: readonly string[] = [
  've-chung-toi',
  'chinh-sach-bao-hanh',
  'chinh-sach-doi-tra',
  'chinh-sach-giao-hang',
  'dieu-khoan-su-dung',
  'huong-dan-do-size',
];

const isReserved = (slug: string) => RESERVED_PAGE_SLUGS.includes(slug);
const isSlugConflict = (error: unknown) => getDuplicateInfo(error)?.table === 'pages';

@Injectable()
export class PageService {
  constructor(private readonly pages: PageRepository) {}

  listPublic() {
    return this.pages.findActiveSummaries();
  }

  async getPublic(slug: string) {
    const page = await this.pages.findActiveBySlug(slug);
    if (!page) throw this.notFound();
    return { slug: page.slug, title: page.title, content: page.content, updatedAt: page.updatedAt };
  }

  async listAdmin() {
    const rows = await this.pages.findAll();
    return rows.map((row) => this.toAdmin(row));
  }

  async getAdmin(id: number) {
    return this.toAdmin(await this.getOrFail(id));
  }

  async create(dto: CreatePageDto) {
    let id: number;
    try {
      id = await this.pages.insert({ slug: dto.slug, title: dto.title, content: dto.content, isActive: dto.isActive });
    } catch (error) {
      throw isSlugConflict(error) ? this.slugConflict() : error;
    }
    return this.getAdmin(id);
  }

  async update(id: number, dto: UpdatePageDto) {
    const current = await this.getOrFail(id);
    if (dto.slug !== undefined && dto.slug !== current.slug && isReserved(current.slug)) {
      throw this.reserved('Trang hệ thống không được đổi slug');
    }
    try {
      await this.pages.update(id, dto);
    } catch (error) {
      throw isSlugConflict(error) ? this.slugConflict() : error;
    }
    return this.getAdmin(id);
  }

  async remove(id: number): Promise<void> {
    const current = await this.getOrFail(id);
    if (isReserved(current.slug)) throw this.reserved('Trang hệ thống không được xóa, hãy ẩn trang nếu không muốn hiển thị');
    await this.pages.delete(id);
  }

  private toAdmin(page: PageRow) {
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

  private async getOrFail(id: number): Promise<PageRow> {
    const page = await this.pages.findById(id);
    if (!page) throw this.notFound();
    return page;
  }

  private slugConflict(): BusinessException {
    return new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
      { field: 'slug', message: 'Slug đã tồn tại' },
    ]);
  }

  private reserved(message: string): BusinessException {
    return new BusinessException(ErrorCode.RESERVED_PAGE, message, HttpStatus.CONFLICT);
  }

  private notFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy trang', HttpStatus.NOT_FOUND);
  }
}
