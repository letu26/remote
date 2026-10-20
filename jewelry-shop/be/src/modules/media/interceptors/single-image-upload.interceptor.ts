import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Observable } from 'rxjs';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { MAX_IMAGE_BYTES } from '../services/image-validation.js';

const MulterInterceptor = FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });

/** Đọc multipart một file (field `file`, tối đa 5MB) vào bộ nhớ; lỗi multer đổi thành 400 INVALID_IMAGE. */
@Injectable()
export class SingleImageUploadInterceptor implements NestInterceptor {
  private readonly inner = new MulterInterceptor();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    try {
      return await this.inner.intercept(context, next);
    } catch (error) {
      if (error instanceof HttpException) {
        const message =
          error.getStatus() === HttpStatus.PAYLOAD_TOO_LARGE
            ? 'Mỗi ảnh tối đa 5MB'
            : 'Yêu cầu tải ảnh không hợp lệ: cần gửi multipart/form-data với một file ở field "file"';
        throw new BusinessException(ErrorCode.INVALID_IMAGE, message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }
}
