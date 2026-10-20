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
import { resolvePage, toPage } from '../../../utils/pagination.js';
import { persistWithSlug } from '../../../utils/slug.util.js';
import { ImageCleanupService } from '../../media/services/image-cleanup.service.js';
import { ArticleRepository } from '../repositories/article.repository.js';
const MAX_SLUG_LENGTH = 280;
const RELATED_LIMIT = 3;
const isSlugConflict = (error) => getDuplicateInfo(error)?.table === 'articles';
let ArticleService = class ArticleService {
    articles;
    cleanup;
    constructor(articles, cleanup) {
        this.articles = articles;
        this.cleanup = cleanup;
    }
    async listPublic(query) {
        const request = resolvePage(query, 9, 24);
        const { rows, total } = await this.articles.findPublishedPage(query.q || undefined, request.pageSize, request.offset, new Date());
        return toPage(rows, total, request);
    }
    async getPublicBySlug(slug) {
        const now = new Date();
        const article = await this.articles.findPublishedBySlug(slug, now);
        if (!article)
            throw this.notFound();
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
    async listAdmin(query) {
        const request = resolvePage(query, 20, 100);
        const { rows, total } = await this.articles.findAdminPage(query.q || undefined, query.published, request.pageSize, request.offset);
        return toPage(rows, total, request);
    }
    getAdmin(id) {
        return this.getOrFail(id);
    }
    async create(authorId, dto) {
        const published = dto.isPublished === true;
        const id = await persistWithSlug({
            name: dto.title,
            slug: dto.slug,
            maxLength: MAX_SLUG_LENGTH,
            findTaken: (prefix) => this.articles.findSlugsStartingWith(prefix),
            isSlugConflict,
            save: (slug) => this.articles.insert({
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
    async update(id, dto) {
        const current = await this.getOrFail(id);
        const publishedAt = dto.isPublished === true && current.publishedAt === null ? new Date() : undefined;
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
        }
        catch (error) {
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
    async remove(id) {
        const current = await this.getOrFail(id);
        await this.articles.delete(id);
        this.cleanup.scheduleDeletion([current.thumbnailPublicId]);
    }
    async getOrFail(id) {
        const article = await this.articles.findById(id);
        if (!article)
            throw this.notFound();
        return article;
    }
    notFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy bài viết', HttpStatus.NOT_FOUND);
    }
};
ArticleService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ArticleRepository,
        ImageCleanupService])
], ArticleService);
export { ArticleService };
//# sourceMappingURL=article.service.js.map