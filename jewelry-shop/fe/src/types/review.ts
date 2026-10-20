/** Kiểu dữ liệu đánh giá sản phẩm (API_CONTRACT_PHASE5.md). */

export interface ReviewSummary {
  avgRating: number;
  reviewCount: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface PublicReview {
  id: number;
  rating: number;
  comment: string | null;
  reviewerName: string;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
}

export interface ReviewPage {
  summary: ReviewSummary;
  items: PublicReview[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MyReview {
  id: number;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MyReviewState {
  eligible: boolean;
  reason: "NOT_PURCHASED" | "ALREADY_REVIEWED" | null;
  review: MyReview | null;
}

export interface MyReviewListItem extends MyReview {
  productId: number;
  productName: string;
  productSlug: string;
}

export interface ReviewInput {
  rating: number;
  comment?: string;
}
