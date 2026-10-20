import { Injectable, Logger } from '@nestjs/common';
import { ImageStorage } from './image-storage.js';

/** Xóa ảnh trên kho lưu trữ ở nền; lỗi chỉ ghi log, không ảnh hưởng request. */
@Injectable()
export class ImageCleanupService {
  private readonly logger = new Logger(ImageCleanupService.name);

  constructor(private readonly storage: ImageStorage) {}

  scheduleDeletion(publicIds: (string | null | undefined)[]): void {
    if (!this.storage.isConfigured()) return;
    for (const publicId of publicIds) {
      if (!publicId) continue;
      void Promise.resolve()
        .then(() => this.storage.delete(publicId))
        .catch((error: unknown) =>
          this.logger.warn(`Không xóa được ảnh ${publicId}: ${error instanceof Error ? error.message : 'unknown'}`),
        );
    }
  }
}
