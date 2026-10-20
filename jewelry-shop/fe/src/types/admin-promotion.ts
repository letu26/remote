export type PromotionStatus = "active" | "upcoming" | "expired" | "disabled";

export interface AdminPromotion {
  id: number;
  name: string;
  productId: number;
  productCode: string;
  productName: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  status: PromotionStatus;
  createdAt: string;
}

export interface PromotionQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: PromotionStatus;
  productId?: number;
}

export interface PromotionCreateInput {
  name: string;
  productIds: number[];
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}
export interface PromotionUpdateInput {
  name?: string;
  discountPercent?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}
