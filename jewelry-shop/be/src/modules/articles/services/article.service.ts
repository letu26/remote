import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { getDuplicateInfo } from '../../../utils/db-error.util.js';
import { type Page, resolvePage, toPage } from '../../../utils/pagination.js';
import { persistWithSlug } from '../../../utils/slug.util.js';
import { ImageCleanupService } from '../../media/services/image-cleanup.service.js';
import type {
  AdminArticleListQueryDto,
  ArticleListQueryDto,
  CreateArticleDto,
  UpdateArticleDto,
} from '../dtos/article.dtos.js';
import { type AdminArticleListRow, type ArticleListRow, type ArticleRow, ArticleRepository } from '../repositories/article.repository.js';

const MAX_SLUG_LENGTH = 280;
const RELATED_LIMIT = 3;
const isSlugConflict = (error: unknown) => getDuplicateInfo(error)?.table === 'articles';

@Injectable()
export class ArticleService {
  constructor(
    private readonly articles: ArticleRepository,
    private readonly cleanup: ImageCleanupService,
  ) {}

  async listPublic(query: ArticleListQueryDto): Promise<Page<ArticleListRow>> {
    const request = resolvePage(query, 9, 24);
    const { rows, total } = await this.articles.findPublishedPage(query.q || undefined, request.pageSize, request.offset, new Date());
    return toPage(rows, total, request);
  }

  async getPublicBySlug(slug: string) {
    const now = new Date();
    const article = await this.articles.findPublishedBySlug(slug, now);
    if (!article) throw this.notFound();
    const related = await this.articles.findRelated(article.id, RELATED_LIMIT, now);
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      thumbnailUrl: article.thumbnailUrl,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      related,
    };
  }

  async listAdmin(query: AdminArticleListQueryDto): Promise<Page<AdminArticleListRow>> {
    const request = resolvePage(query, 20, 100);
    const { rows, total } = await this.articles.findAdminPage(query.q || undefined, query.published, request.pageSize, request.offset);
    return toPage(rows, total, request);
  }

  getAdmin(id: number): Promise<ArticleRow> {
    return this.getOrFail(id);
  }

  async create(authorId: number, dto: CreateArticleDto): Promise<ArticleRow> {
    const published = dto.isPublished === true;
    const id = await persistWithSlug({
      name: dto.title,
      slug: dto.slug,
      maxLength: MAX_SLUG_LENGTH,
      findTaken: (prefix) => this.articles.findSlugsStartingWith(prefix),
      isSlugConflict,
      save: (slug) =>
        this.articles.insert({
          title: dto.title,
          slug,
          summary: dto.summary || null,
          content: dto.content,
          thumbnailUrl: dto.thumbnailUrl || null,
          thumbnailPublicId: dto.thumbnailUrl ? dto.thumbnailPublicId : null,
          authorId,
          isPublished: published,
          publishedAt: published ? new Date() : null,
        }),
    });
    return this.getOrFail(id);
  }

  async update(id: number, dto: UpdateArticleDto): Promise<ArticleRow> {
    const current = await this.getOrFail(id);

    // publishedAt: đặt khi đăng lần đầu; gỡ đăng giữ nguyên (bài bị ẩn vì isPublished=0).
    const publishedAt = dto.isPublished === true && current.publishedAt === null ? new Date() : undefined;
    // null hoặc "" = bỏ ảnh đại diện (xóa cả publicId). Đổi ảnh mà không gửi publicId mới: publicId cũ không còn đúng.
    const clearingThumbnail = dto.thumbnailUrl === null || dto.thumbnailUrl === '';
    const thumbnailUrl = clearingThumbnail ? null : dto.thumbnailUrl;
    const thumbnailPublicId = clearingThumbnail
      ? null
      : dto.thumbnailUrl !== undefined && dto.thumbnailPublicId === undefined
        ? null
        : dto.thumbnailPublicId;

    try {
      await this.articles.update(id, {
        title: dto.title,
        slug: dto.slug,
        summary: dto.summary === undefined ? undefined : dto.summary || null,
        content: dto.content,
        thumbnailUrl,
        thumbnailPublicId,
        isPublished: dto.isPublished,
        publishedAt,
      });
    } catch (error) {
      if (isSlugConflict(error)) {
        throw new BusinessException(ErrorCode.SLUG_ALREADY_EXISTS, 'Slug đã tồn tại, vui lòng chọn slug khác', HttpStatus.CONFLICT, undefined, [
          { field: 'slug', message: 'Slug đã tồn tại' },
        ]);
      }
      throw error;
    }
    const updated = await this.getOrFail(id);
    if (current.thumbnailPublicId && current.thumbnailPublicId !== updated.thumbnailPublicId) {
      this.cleanup.scheduleDeletion([current.thumbnailPublicId]);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    const current = await this.getOrFail(id);
    await this.articles.delete(id);
    this.cleanup.scheduleDeletion([current.thumbnailPublicId]);
  }

  private async getOrFail(id: number): Promise<ArticleRow> {
    const article = await this.articles.findById(id);
    if (!article) throw this.notFound();
    return article;
  }

  private notFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy bài viết', HttpStatus.NOT_FOUND);
  }
}
