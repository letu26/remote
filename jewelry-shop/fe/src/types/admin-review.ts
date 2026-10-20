export interface AdminReview {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  productSlug: string;
  userId: number;
  reviewerName: string;
  reviewerPhone: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  rating?: number;
  hidden?: boolean;
  productId?: number;
}
