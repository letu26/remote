import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { type Page, resolvePage, toPage } from '../../../utils/pagination.js';
import type { AdminReviewListQueryDto } from '../dtos/review.dtos.js';
import { type AdminReviewRow, ReviewQueryRepository } from '../repositories/review-query.repository.js';
import { ReviewRepository } from '../repositories/review.repository.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class ReviewAdminService {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly queries: ReviewQueryRepository,
  ) {}

  async list(query: AdminReviewListQueryDto): Promise<Page<AdminReviewRow>> {
    const request = resolvePage(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const { rows, total } = await this.queries.findAdminPage(
      { q: query.q || undefined, rating: query.rating, hidden: query.hidden, productId: query.productId },
      request.pageSize,
      request.offset,
    );
    return toPage(rows, total, request);
  }

  /** Đặt lại đúng giá trị cũ thì không đổi gì (vẫn tính lại cho chắc) và vẫn trả 200. */
  async setVisibility(id: number, isHidden: boolean): Promise<AdminReviewRow> {
    const outcome = await this.reviews.withLockedReview({ id }, async (tx) => {
      if (tx.review.isHidden !== isHidden) await tx.setHidden(isHidden);
      return true;
    });
    const review = outcome === null ? null : await this.queries.findAdminById(id);
    if (!review) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy đánh giá', HttpStatus.NOT_FOUND);
    return review;
  }
}
