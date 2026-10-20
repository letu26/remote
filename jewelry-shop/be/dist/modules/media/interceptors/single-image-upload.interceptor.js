var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { MAX_IMAGE_BYTES } from '../services/image-validation.js';
const MulterInterceptor = FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });
let SingleImageUploadInterceptor = class SingleImageUploadInterceptor {
    inner = new MulterInterceptor();
    async intercept(context, next) {
        try {
            return await this.inner.intercept(context, next);
        }
        catch (error) {
            if (error instanceof HttpException) {
                const message = error.getStatus() === HttpStatus.PAYLOAD_TOO_LARGE
                    ? 'Mỗi ảnh tối đa 5MB'
                    : 'Yêu cầu tải ảnh không hợp lệ: cần gửi multipart/form-data với một file ở field "file"';
                throw new BusinessException(ErrorCode.INVALID_IMAGE, message, HttpStatus.BAD_REQUEST);
            }
            throw error;
        }
    }
};
SingleImageUploadInterceptor = __decorate([
    Injectable()
], SingleImageUploadInterceptor);
export { SingleImageUploadInterceptor };
//# sourceMappingURL=single-image-upload.interceptor.js.map