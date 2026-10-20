import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { ImageStorage, type StoredImage } from './image-storage.js';

@Injectable()
export class CloudinaryImageStorage extends ImageStorage {
  private readonly logger = new Logger(CloudinaryImageStorage.name);
  private readonly configured: boolean;

  constructor(config: ConfigService) {
    super();
    this.configured = this.configure(config.get<string>('CLOUDINARY_URL'));
  }

  isConfigured(): boolean {
    return this.configured;
  }

  upload(data: Buffer, folder: string): Promise<StoredImage> {
    return new Promise<StoredImage>((resolve, reject) => {
      const fail = (error: unknown) => {
        const detail = error as { message?: string; http_code?: number } | undefined;
        this.logger.error(`Cloudinary upload failed: ${detail?.http_code ?? ''} ${detail?.message ?? 'unknown'}`);
        reject(
          new BusinessException(ErrorCode.UPLOAD_FAILED, 'Không tải được ảnh lên kho lưu trữ, vui lòng thử lại', HttpStatus.BAD_GATEWAY),
        );
      };
      try {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'image', overwrite: false },
          (error, result) => {
            if (error || !result) return fail(error);
            resolve({ url: result.secure_url, publicId: result.public_id });
          },
        );
        stream.end(data);
      } catch (error) {
        fail(error);
      }
    });
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  }

  /** Đọc cloudinary://<api_key>:<api_secret>@<cloud_name>; trống/sai định dạng thì coi như chưa cấu hình. */
  private configure(rawUrl: string | undefined): boolean {
    if (!rawUrl?.trim()) return false;
    try {
      const url = new URL(rawUrl.trim());
      if (url.protocol !== 'cloudinary:' || !url.username || !url.password || !url.hostname) throw new Error('format');
      cloudinary.config({
        cloud_name: url.hostname,
        api_key: decodeURIComponent(url.username),
        api_secret: decodeURIComponent(url.password),
        secure: true,
      });
      return true;
    } catch {
      this.logger.warn('CLOUDINARY_URL không đúng định dạng cloudinary://key:secret@cloud_name, tính năng tải ảnh bị tắt');
      return false;
    }
  }
}
