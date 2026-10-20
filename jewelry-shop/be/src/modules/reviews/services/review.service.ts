import { HttpStatus, Injectable } from '@nestjs/common';
import { AccessDeniedException, BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { getDuplicateInfo } from '../../../utils/db-error.util.js';
import { type Page, resolvePage, toPage } from '../../../utils/pagination.js';
import { maskReviewerName } from '../../../utils/reviewer-name.util.js';
import type { CreateReviewDto, ReviewListQueryDto, UpdateReviewDto } from '../dtos/review.dtos.js';
import { type ReviewRow, ReviewQueryRepository } from '../repositories/review-query.repository.js';
import { ReviewRepository } from '../repositories/review.repository.js';
import { CatalogService } from '../../catalog/services/catalog.service.js';
import type { PageQueryDto } from '../../../utils/pagination.js';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const STARS = [1, 2, 3, 4, 5] as const;

const normalizeComment = (comment: string | null | undefined): string | null => comment?.trim() || null;

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly queries: ReviewQueryRepository,
    private readonly catalog: CatalogService,
  ) {}

  /** Danh sách công khai: summary tính trên mọi đánh giá hiển thị, độc lập với bộ lọc/trang. */
  async listForProduct(slug: string, query: ReviewListQueryDto, viewerId: number | null) {
    const productId = await this.requireProductId(slug);
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const [distribution, { rows, total }] = await Promise.all([
      this.queries.countByRating(productId),
      this.queries.findVisiblePage(productId, query.rating, request.pageSize, request.offset),
    ]);

    const counts = Object.fromEntries(STARS.map((star) => [star, distribution.get(star) ?? 0])) as Record<number, number>;
    const reviewCount = STARS.reduce((sum, star) => sum + counts[star], 0);
    const ratingSum = STARS.reduce((sum, star) => sum + star * counts[star], 0);
    const avgRating = reviewCount ? Math.round((ratingSum / reviewCount) * 100) / 100 : 0;

    const items = rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      reviewerName: maskReviewerName(row.fullName),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isMine: viewerId !== null && row.userId === viewerId,
    }));
    return { summary: { avgRating, reviewCount, distribution: counts }, ...toPage(items, total, request) };
  }

  async getMyReview(userId: number, slug: string) {
    const productId = await this.requireProductId(slug);
    const review = await this.queries.findByUserAndProduct(userId, productId);
    if (review) return { eligible: false, reason: 'ALREADY_REVIEWED' as const, review };
    const purchased = (await this.queries.findLatestDeliveredOrderItemId(userId, productId)) !== null;
    return purchased
      ? { eligible: true, reason: null, review: null }
      : { eligible: false, reason: 'NOT_PURCHASED' as const, review: null };
  }

  async create(userId: number, slug: string, dto: CreateReviewDto): Promise<ReviewRow> {
    const productId = await this.requireProductId(slug);
    const orderItemId = await this.queries.findLatestDeliveredOrderItemId(userId, productId);
    if (orderItemId === null) {
      throw new AccessDeniedException(
        'Chỉ khách đã mua và nhận hàng mới có thể đánh giá sản phẩm này',
        ErrorCode.REVIEW_NOT_ALLOWED,
      );
    }
    let id: number;
    try {
      id = await this.reviews.create({ userId, productId, orderItemId, rating: dto.rating, comment: normalizeComment(dto.comment) });
    } catch (error) {
      // Trùng (userId, productId) hoặc orderItemId: bấm đúp / hai request song song.
      if (getDuplicateInfo(error)?.table === 'reviews') {
        throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS, 'Bạn đã đánh giá sản phẩm này rồi', HttpStatus.CONFLICT);
      }
      throw error;
    }
    return this.getOrFail(id);
  }

  async update(userId: number, id: number, dto: UpdateReviewDto): Promise<ReviewRow> {
    if (dto.rating === undefined && dto.comment === undefined) {
      throw new ValidationException([{ field: 'rating', message: 'Cần ít nhất một trường: rating hoặc comment' }]);
    }
    const outcome = await this.reviews.withLockedReview({ id, userId }, async (tx) => {
      if (tx.review.isHidden) return 'hidden' as const;
      await tx.update({
        rating: dto.rating,
        comment: dto.comment === undefined ? undefined : normalizeComment(dto.comment),
      });
      return 'ok' as const;
    });
    if (outcome === null) throw this.notFound();
    if (outcome === 'hidden') {
      throw new AccessDeniedException(
        'Đánh giá của bạn đang bị ẩn bởi quản trị viên nên chưa thể chỉnh sửa',
        ErrorCode.REVIEW_HIDDEN,
      );
    }
    return this.getOrFail(id);
  }

  async remove(userId: number, id: number): Promise<void> {
    const outcome = await this.reviews.withLockedReview({ id, userId }, (tx) => tx.remove());
    if (outcome === null) throw this.notFound();
  }

  async listMine(userId: number, query: PageQueryDto): Promise<Page<unknown>> {
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const { rows, total } = await this.queries.findMinePage(userId, request.pageSize, request.offset);
    return toPage(rows, total, request);
  }

  private async requireProductId(slug: string): Promise<number> {
    const product = await this.queries.findActiveProductBySlug(slug);
    // Cùng điều kiện hiển thị với GET /products/:slug: sản phẩm ẩn hoặc thuộc danh mục ẩn (kể cả tổ tiên ẩn) -> 404.
    const visibleCategories = this.catalog.flattenTree(await this.catalog.getCategoryTree());
    if (!product || !visibleCategories.has(product.categoryId)) {
      throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
    }
    return product.id;
  }

  private async getOrFail(id: number): Promise<ReviewRow> {
    const review = await this.queries.findById(id);
    if (!review) throw this.notFound();
    return review;
  }

  private notFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy đánh giá', HttpStatus.NOT_FOUND);
  }
}
