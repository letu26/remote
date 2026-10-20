import { DataSource } from 'typeorm';
export interface ImageRecord {
    id: number;
    url: string;
    publicId: string | null;
    isPrimary: boolean;
    sortOrder: number;
}
export interface NewImage {
    url: string;
    publicId: string;
}
export type AddImagesResult = {
    ok: true;
    images: ImageRecord[];
} | {
    ok: false;
    reason: 'limit' | 'product_missing';
};
export declare class ProductImageRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    productExists(productId: number): Promise<boolean>;
    countByProduct(productId: number): Promise<number>;
    findByProduct(productId: number): Promise<ImageRecord[]>;
    findOne(productId: number, imageId: number): Promise<ImageRecord | null>;
    addAll(productId: number, uploaded: NewImage[], maxImages: number): Promise<AddImagesResult>;
    update(productId: number, imageId: number, data: {
        isPrimary?: boolean;
        sortOrder?: number;
    }): Promise<void>;
    reorder(productId: number, orderedIds: number[]): Promise<void>;
    remove(productId: number, imageId: number): Promise<{
        publicId: string | null;
    } | null>;
}
