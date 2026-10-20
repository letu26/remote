import { Module } from '@nestjs/common';
import { MediaController } from './controllers/media.controller.js';
import { SingleImageUploadInterceptor } from './interceptors/single-image-upload.interceptor.js';
import { CloudinaryImageStorage } from './services/cloudinary-image-storage.js';
import { ImageCleanupService } from './services/image-cleanup.service.js';
import { ImageStorage } from './services/image-storage.js';
import { MediaUploadService } from './services/media-upload.service.js';

@Module({
  controllers: [MediaController],
  providers: [
    { provide: ImageStorage, useClass: CloudinaryImageStorage },
    ImageCleanupService,
    MediaUploadService,
    SingleImageUploadInterceptor,
  ],
  exports: [ImageStorage, ImageCleanupService],
})
export class MediaModule {}
