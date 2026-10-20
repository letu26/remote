import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { ImageStorage, type StoredImage } from './image-storage.js';
import { assertValidImageFile, type UploadedImageFile } from './image-validation.js';

@Injectable()
export class MediaUploadService {
  private readonly folder: string;

  constructor(
    private readonly storage: ImageStorage,
    config: ConfigService,
  ) {
    this.folder = `${config.get<string>('CLOUDINARY_FOLDER')?.trim() || 'jewelry-shop'}/cms`;
  }

  async uploadCmsImage(file: UploadedImageFile | undefined): Promise<StoredImage> {
    if (!file) {
      throw new BusinessException(ErrorCode.INVALID_IMAGE, 'Chưa chọn ảnh để tải lên', HttpStatus.BAD_REQUEST);
    }
    assertValidImageFile(file);
    if (!this.storage.isConfigured()) {
      throw new BusinessException(
        ErrorCode.UPLOAD_NOT_CONFIGURED,
        'Chức năng tải ảnh chưa được cấu hình (thiếu CLOUDINARY_URL)',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return this.storage.upload(file.buffer, this.folder);
  }
}
