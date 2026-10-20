var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { ImageStorage } from './image-storage.js';
import { assertValidImageFile } from './image-validation.js';
let MediaUploadService = class MediaUploadService {
    storage;
    folder;
    constructor(storage, config) {
        this.storage = storage;
        this.folder = `${config.get('CLOUDINARY_FOLDER')?.trim() || 'jewelry-shop'}/cms`;
    }
    async uploadCmsImage(file) {
        if (!file) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE, 'Chưa chọn ảnh để tải lên', HttpStatus.BAD_REQUEST);
        }
        assertValidImageFile(file);
        if (!this.storage.isConfigured()) {
            throw new BusinessException(ErrorCode.UPLOAD_NOT_CONFIGURED, 'Chức năng tải ảnh chưa được cấu hình (thiếu CLOUDINARY_URL)', HttpStatus.SERVICE_UNAVAILABLE);
        }
        return this.storage.upload(file.buffer, this.folder);
    }
};
MediaUploadService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ImageStorage,
        ConfigService])
], MediaUploadService);
export { MediaUploadService };
//# sourceMappingURL=media-upload.service.js.map