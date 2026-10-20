import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { SingleImageUploadInterceptor } from '../interceptors/single-image-upload.interceptor.js';
import type { UploadedImageFile } from '../services/image-validation.js';
import { MediaUploadService } from '../services/media-upload.service.js';

@Controller('admin/media')
@AdminOnly()
export class MediaController {
  constructor(private readonly service: MediaUploadService) {}

  @Post('images')
  @UseInterceptors(SingleImageUploadInterceptor)
  async upload(@UploadedFile() file: UploadedImageFile | undefined) {
    const { url, publicId } = await this.service.uploadCmsImage(file);
    return { url, publicId };
  }
}
