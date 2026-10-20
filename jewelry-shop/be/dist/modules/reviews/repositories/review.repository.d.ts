import { DataSource } from 'typeorm';
export interface LockedReview {
    id: number;
    userId: number;
    productId: number;
    isHidden: boolean;
}
export interface ReviewTransaction {
    review: LockedReview;
    update(fields: {
        rating?: number;
        comment?: string | null;
    }): Promise<void>;
    setHidden(isHidden: boolean): Promise<void>;
    remove(): Promise<void>;
}
export declare class ReviewRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    create(data: {
        userId: number;
        productId: number;
        orderItemId: number;
        rating: number;
        comment: string | null;
    }): Promise<number>;
    withLockedReview<T>(where: {
        id: number;
        userId?: number;
    }, work: (tx: ReviewTransaction) => Promise<T>): Promise<T | null>;
    private lockProduct;
    private recalculate;
}
