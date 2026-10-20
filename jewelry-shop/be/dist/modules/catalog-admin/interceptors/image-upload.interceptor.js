var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { HttpException, HttpStatus, Injectable, } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 8;
export const UPLOAD_FIELD = 'files';
const MulterInterceptor = FilesInterceptor(UPLOAD_FIELD, MAX_FILES_PER_REQUEST, {
    limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_FILES_PER_REQUEST },
});
let ImageUploadInterceptor = class ImageUploadInterceptor {
    inner = new MulterInterceptor();
    async intercept(context, next) {
        try {
            return await this.inner.intercept(context, next);
        }
        catch (error) {
            throw this.translate(error);
        }
    }
    translate(error) {
        if (!(error instanceof HttpException))
            return error;
        const status = error.getStatus();
        if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
            return new BusinessException(ErrorCode.INVALID_IMAGE, 'Mỗi ảnh tối đa 5MB', HttpStatus.BAD_REQUEST);
        }
        const message = error.message;
        if (/too many files/i.test(message)) {
            return new BusinessException(ErrorCode.IMAGE_LIMIT_EXCEEDED, `Mỗi lần tải tối đa ${MAX_FILES_PER_REQUEST} ảnh`, HttpStatus.BAD_REQUEST);
        }
        if (status === HttpStatus.BAD_REQUEST) {
            return new BusinessException(ErrorCode.INVALID_IMAGE, `Yêu cầu tải ảnh không hợp lệ: cần gửi multipart/form-data với field "${UPLOAD_FIELD}"`, HttpStatus.BAD_REQUEST);
        }
        return error;
    }
};
ImageUploadInterceptor = __decorate([
    Injectable()
], ImageUploadInterceptor);
export { ImageUploadInterceptor };
//# sourceMappingURL=image-upload.interceptor.js.map