import { ConfigService } from '@nestjs/config';
import { ImageStorage } from '../../media/services/image-storage.js';
import type { UpdateImageDto } from '../dtos/product-admin.dtos.js';
import { ProductImageRepository } from '../repositories/product-image.repository.js';
export declare const MAX_IMAGES_PER_PRODUCT = 10;
export interface UploadedImageFile {
    buffer: Buffer;
    mimetype: string;
    size: number;
}
export interface ImageView {
    id: number;
    url: string;
    isPrimary: boolean;
    sortOrder: number;
}
export declare class ProductImageService {
    private readonly images;
    private readonly storage;
    private readonly logger;
    private readonly folderRoot;
    constructor(images: ProductImageRepository, storage: ImageStorage, config: ConfigService);
    upload(productId: number, files: UploadedImageFile[] | undefined): Promise<ImageView[]>;
    update(productId: number, imageId: number, dto: UpdateImageDto): Promise<ImageView>;
    reorder(productId: number, imageIds: number[]): Promise<ImageView[]>;
    remove(productId: number, imageId: number): Promise<void>;
    scheduleStorageDeletion(publicIds: string[]): void;
    private validateFiles;
    private uploadAll;
    private limitExceeded;
    private productNotFound;
    private imageNotFound;
}
