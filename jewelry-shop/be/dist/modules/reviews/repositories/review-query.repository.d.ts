import { DataSource } from 'typeorm';
export interface ReviewRow {
    id: number;
    rating: number;
    comment: string | null;
    isHidden: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PublicReviewRow {
    id: number;
    userId: number;
    fullName: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface MyReviewRow extends ReviewRow {
    productId: number;
    productName: string;
    productSlug: string;
}
export interface AdminReviewRow extends ReviewRow {
    productId: number;
    productName: string;
    productCode: string;
    productSlug: string;
    userId: number;
    reviewerName: string;
    reviewerPhone: string;
}
export interface AdminReviewFilter {
    q?: string;
    rating?: number;
    hidden?: boolean;
    productId?: number;
}
export declare class ReviewQueryRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findActiveProductBySlug(slug: string): Promise<{
        id: number;
        categoryId: number;
    } | null>;
    countByRating(productId: number): Promise<Map<number, number>>;
    findVisiblePage(productId: number, rating: number | undefined, limit: number, offset: number): Promise<{
        rows: PublicReviewRow[];
        total: number;
    }>;
    findByUserAndProduct(userId: number, productId: number): Promise<ReviewRow | null>;
    findById(id: number): Promise<ReviewRow | null>;
    findLatestDeliveredOrderItemId(userId: number, productId: number): Promise<number | null>;
    findMinePage(userId: number, limit: number, offset: number): Promise<{
        rows: MyReviewRow[];
        total: number;
    }>;
    findAdminPage(filter: AdminReviewFilter, limit: number, offset: number): Promise<{
        rows: AdminReviewRow[];
        total: number;
    }>;
    findAdminById(id: number): Promise<AdminReviewRow | null>;
}
