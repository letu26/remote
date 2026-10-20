import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Observable } from 'rxjs';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 8;
export const UPLOAD_FIELD = 'files';

const MulterInterceptor = FilesInterceptor(UPLOAD_FIELD, MAX_FILES_PER_REQUEST, {
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_FILES_PER_REQUEST },
});

/**
 * Đọc multipart vào bộ nhớ (field `files`, tối đa 8 file, mỗi file 5MB).
 * Đổi lỗi của multer (quá dung lượng, quá số file, sai field) thành 400 INVALID_IMAGE/IMAGE_LIMIT_EXCEEDED.
 */
@Injectable()
export class ImageUploadInterceptor implements NestInterceptor {
  private readonly inner = new MulterInterceptor();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    try {
      return await this.inner.intercept(context, next);
    } catch (error) {
      throw this.translate(error);
    }
  }

  private translate(error: unknown): unknown {
    if (!(error instanceof HttpException)) return error;
    const status = error.getStatus();
    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      return new BusinessException(ErrorCode.INVALID_IMAGE, 'Mỗi ảnh tối đa 5MB', HttpStatus.BAD_REQUEST);
    }
    const message = error.message;
    if (/too many files/i.test(message)) {
      return new BusinessException(ErrorCode.IMAGE_LIMIT_EXCEEDED, `Mỗi lần tải tối đa ${MAX_FILES_PER_REQUEST} ảnh`, HttpStatus.BAD_REQUEST);
    }
    if (status === HttpStatus.BAD_REQUEST) {
      return new BusinessException(
        ErrorCode.INVALID_IMAGE,
        `Yêu cầu tải ảnh không hợp lệ: cần gửi multipart/form-data với field "${UPLOAD_FIELD}"`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return error;
  }
}
