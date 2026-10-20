import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException, ErrorCode, ValidationException } from '../../../exceptions/index.js';
import { detectImageKind, MIME_BY_KIND } from '../../../utils/image-signature.util.js';
import { ImageStorage, type StoredImage } from '../../media/services/image-storage.js';
import type { UpdateImageDto } from '../dtos/product-admin.dtos.js';
import { MAX_IMAGE_BYTES } from '../interceptors/image-upload.interceptor.js';
import { type ImageRecord, ProductImageRepository } from '../repositories/product-image.repository.js';

export const MAX_IMAGES_PER_PRODUCT = 10;

/** Phần của file multer (đọc vào bộ nhớ) mà service cần. */
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

const toView = ({ id, url, isPrimary, sortOrder }: ImageRecord): ImageView => ({ id, url, isPrimary, sortOrder });

@Injectable()
export class ProductImageService {
  private readonly logger = new Logger(ProductImageService.name);
  private readonly folderRoot: string;

  constructor(
    private readonly images: ProductImageRepository,
    private readonly storage: ImageStorage,
    config: ConfigService,
  ) {
    this.folderRoot = config.get<string>('CLOUDINARY_FOLDER')?.trim() || 'jewelry-shop';
  }

  async upload(productId: number, files: UploadedImageFile[] | undefined): Promise<ImageView[]> {
    if (!(await this.images.productExists(productId))) throw this.productNotFound();

    this.validateFiles(files ?? []);
    const valid = files as UploadedImageFile[];
    const existing = await this.images.countByProduct(productId);
    if (existing + valid.length > MAX_IMAGES_PER_PRODUCT) throw this.limitExceeded(existing);

    if (!this.storage.isConfigured()) {
      throw new BusinessException(
        ErrorCode.UPLOAD_NOT_CONFIGURED,
        'Chức năng tải ảnh chưa được cấu hình (thiếu CLOUDINARY_URL)',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const uploaded = await this.uploadAll(valid, `${this.folderRoot}/products/${productId}`);
    try {
      const result = await this.images.addAll(productId, uploaded, MAX_IMAGES_PER_PRODUCT);
      if (!result.ok) {
        throw result.reason === 'limit' ? this.limitExceeded(existing) : this.productNotFound();
      }
      return result.images.map(toView);
    } catch (error) {
      // Ghi DB lỗi thì không để ảnh mồ côi trên kho lưu trữ (xóa trùng lặp là vô hại).
      this.scheduleStorageDeletion(uploaded.map((item) => item.publicId));
      throw error;
    }
  }

  async update(productId: number, imageId: number, dto: UpdateImageDto): Promise<ImageView> {
    const image = await this.images.findOne(productId, imageId);
    if (!image) throw this.imageNotFound();
    if (dto.isPrimary === false && image.isPrimary) {
      throw new ValidationException([
        { field: 'isPrimary', message: 'Không thể bỏ ảnh đại diện; hãy đặt ảnh khác làm ảnh đại diện' },
      ]);
    }
    await this.images.update(productId, imageId, dto);
    const updated = await this.images.findOne(productId, imageId);
    return toView(updated ?? image);
  }

  async reorder(productId: number, imageIds: number[]): Promise<ImageView[]> {
    if (!(await this.images.productExists(productId))) throw this.productNotFound();
    const current = await this.images.findByProduct(productId);
    const sameSet =
      new Set(imageIds).size === imageIds.length &&
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

  async remove(productId: number, imageId: number): Promise<void> {
    const removed = await this.images.remove(productId, imageId);
    if (!removed) throw this.imageNotFound();
    if (removed.publicId) this.scheduleStorageDeletion([removed.publicId]);
  }

  /** Xóa ảnh trên kho lưu trữ ở nền; lỗi chỉ ghi log, không ảnh hưởng request. */
  scheduleStorageDeletion(publicIds: string[]): void {
    if (!publicIds.length || !this.storage.isConfigured()) return;
    for (const publicId of publicIds) {
      void Promise.resolve()
        .then(() => this.storage.delete(publicId))
        .catch((error: unknown) =>
          this.logger.warn(`Không xóa được ảnh ${publicId} trên kho lưu trữ: ${error instanceof Error ? error.message : 'unknown'}`),
        );
    }
  }

  private validateFiles(files: UploadedImageFile[]): void {
    if (!files.length) {
      throw new BusinessException(ErrorCode.INVALID_IMAGE, 'Chưa chọn ảnh nào để tải lên', HttpStatus.BAD_REQUEST);
    }
    for (const file of files) {
      const kind = detectImageKind(file.buffer);
      if (!kind || MIME_BY_KIND[kind] !== file.mimetype) {
        throw new BusinessException(
          ErrorCode.INVALID_IMAGE,
          'Chỉ nhận ảnh JPG, PNG hoặc WEBP hợp lệ',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (file.buffer.length > MAX_IMAGE_BYTES) {
        throw new BusinessException(ErrorCode.INVALID_IMAGE, 'Mỗi ảnh tối đa 5MB', HttpStatus.BAD_REQUEST);
      }
    }
  }

  /** Tải song song; nếu có file lỗi thì xóa các file đã lên rồi báo 502. */
  private async uploadAll(files: UploadedImageFile[], folder: string): Promise<StoredImage[]> {
    const results = await Promise.allSettled(files.map((file) => this.storage.upload(file.buffer, folder)));
    const stored = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    if (failure) {
      this.scheduleStorageDeletion(stored.map((item) => item.publicId));
      throw failure.reason instanceof BusinessException
        ? failure.reason
        : new BusinessException(ErrorCode.UPLOAD_FAILED, 'Không tải được ảnh lên kho lưu trữ, vui lòng thử lại', HttpStatus.BAD_GATEWAY);
    }
    return stored;
  }

  private limitExceeded(existing: number): BusinessException {
    return new BusinessException(
      ErrorCode.IMAGE_LIMIT_EXCEEDED,
      `Mỗi sản phẩm tối đa ${MAX_IMAGES_PER_PRODUCT} ảnh (hiện có ${existing})`,
      HttpStatus.BAD_REQUEST,
    );
  }

  private productNotFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
  }

  private imageNotFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy ảnh của sản phẩm', HttpStatus.NOT_FOUND);
  }
}
