var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProductImageService_1;
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { detectImageKind, MIME_BY_KIND } from '../../../utils/image-signature.util.js';
import { ImageStorage } from '../../media/services/image-storage.js';
import { MAX_IMAGE_BYTES } from '../interceptors/image-upload.interceptor.js';
import { ProductImageRepository } from '../repositories/product-image.repository.js';
export const MAX_IMAGES_PER_PRODUCT = 10;
const toView = ({ id, url, isPrimary, sortOrder }) => ({ id, url, isPrimary, sortOrder });
let ProductImageService = ProductImageService_1 = class ProductImageService {
    images;
    storage;
    logger = new Logger(ProductImageService_1.name);
    folderRoot;
    constructor(images, storage, config) {
        this.images = images;
        this.storage = storage;
        this.folderRoot = config.get('CLOUDINARY_FOLDER')?.trim() || 'jewelry-shop';
    }
    async upload(productId, files) {
        if (!(await this.images.productExists(productId)))
            throw this.productNotFound();
        this.validateFiles(files ?? []);
        const valid = files;
        const existing = await this.images.countByProduct(productId);
        if (existing + valid.length > MAX_IMAGES_PER_PRODUCT)
            throw this.limitExceeded(existing);
        if (!this.storage.isConfigured()) {
            throw new BusinessException(ErrorCode.UPLOAD_NOT_CONFIGURED, 'Chức năng tải ảnh chưa được cấu hình (thiếu CLOUDINARY_URL)', HttpStatus.SERVICE_UNAVAILABLE);
        }
        const uploaded = await this.uploadAll(valid, `${this.folderRoot}/products/${productId}`);
        try {
            const result = await this.images.addAll(productId, uploaded, MAX_IMAGES_PER_PRODUCT);
            if (!result.ok) {
                throw result.reason === 'limit' ? this.limitExceeded(existing) : this.productNotFound();
            }
            return result.images.map(toView);
        }
        catch (error) {
            this.scheduleStorageDeletion(uploaded.map((item) => item.publicId));
            throw error;
        }
    }
    async update(productId, imageId, dto) {
        const image = await this.images.findOne(productId, imageId);
        if (!image)
            throw this.imageNotFound();
        if (dto.isPrimary === false && image.isPrimary) {
            throw new ValidationException([
                { field: 'isPrimary', message: 'Không thể bỏ ảnh đại diện; hãy đặt ảnh khác làm ảnh đại diện' },
            ]);
        }
        await this.images.update(productId, imageId, dto);
        const updated = await this.images.findOne(productId, imageId);
        return toView(updated ?? image);
    }
    async reorder(productId, imageIds) {
        if (!(await this.images.productExists(productId)))
            throw this.productNotFound();
        const current = await this.images.findByProduct(productId);
        const sameSet = new Set(imageIds).size === imageIds.length &&
            imageIds.length === current.length &&
            current.every((image) => imageIds.includes(image.id));
        if (!sameSet) {
            throw new ValidationException([
                { field: 'imageIds', message: 'Danh sách phải gồm đúng tất cả ảnh của sản phẩm, không trùng lặp' },
            ]);
        }
        await this.images.reorder(productId, imageIds);
        return (await this.images.findByProduct(productId)).map(toView);
    }
    async remove(productId, imageId) {
        const removed = await this.images.remove(productId, imageId);
        if (!removed)
            throw this.imageNotFound();
        if (removed.publicId)
            this.scheduleStorageDeletion([removed.publicId]);
    }
    scheduleStorageDeletion(publicIds) {
        if (!publicIds.length || !this.storage.isConfigured())
            return;
        for (const publicId of publicIds) {
            void Promise.resolve()
                .then(() => this.storage.delete(publicId))
                .catch((error) => this.logger.warn(`Không xóa được ảnh ${publicId} trên kho lưu trữ: ${error instanceof Error ? error.message : 'unknown'}`));
        }
    }
    validateFiles(files) {
        if (!files.length) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE, 'Chưa chọn ảnh nào để tải lên', HttpStatus.BAD_REQUEST);
        }
        for (const file of files) {
            const kind = detectImageKind(file.buffer);
            if (!kind || MIME_BY_KIND[kind] !== file.mimetype) {
                throw new BusinessException(ErrorCode.INVALID_IMAGE, 'Chỉ nhận ảnh JPG, PNG hoặc WEBP hợp lệ', HttpStatus.BAD_REQUEST);
            }
            if (file.buffer.length > MAX_IMAGE_BYTES) {
                throw new BusinessException(ErrorCode.INVALID_IMAGE, 'Mỗi ảnh tối đa 5MB', HttpStatus.BAD_REQUEST);
            }
        }
    }
    async uploadAll(files, folder) {
        const results = await Promise.allSettled(files.map((file) => this.storage.upload(file.buffer, folder)));
        const stored = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
        const failure = results.find((result) => result.status === 'rejected');
        if (failure) {
            this.scheduleStorageDeletion(stored.map((item) => item.publicId));
            throw failure.reason instanceof BusinessException
                ? failure.reason
                : new BusinessException(ErrorCode.UPLOAD_FAILED, 'Không tải được ảnh lên kho lưu trữ, vui lòng thử lại', HttpStatus.BAD_GATEWAY);
        }
        return stored;
    }
    limitExceeded(existing) {
        return new BusinessException(ErrorCode.IMAGE_LIMIT_EXCEEDED, `Mỗi sản phẩm tối đa ${MAX_IMAGES_PER_PRODUCT} ảnh (hiện có ${existing})`, HttpStatus.BAD_REQUEST);
    }
    productNotFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
    }
    imageNotFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy ảnh của sản phẩm', HttpStatus.NOT_FOUND);
    }
};
ProductImageService = ProductImageService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ProductImageRepository,
        ImageStorage,
        ConfigService])
], ProductImageService);
export { ProductImageService };
//# sourceMappingURL=product-image.service.js.map