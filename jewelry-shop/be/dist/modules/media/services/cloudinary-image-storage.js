var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CloudinaryImageStorage_1;
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { ImageStorage } from './image-storage.js';
let CloudinaryImageStorage = CloudinaryImageStorage_1 = class CloudinaryImageStorage extends ImageStorage {
    logger = new Logger(CloudinaryImageStorage_1.name);
    configured;
    constructor(config) {
        super();
        this.configured = this.configure(config.get('CLOUDINARY_URL'));
    }
    isConfigured() {
        return this.configured;
    }
    upload(data, folder) {
        return new Promise((resolve, reject) => {
            const fail = (error) => {
                const detail = error;
                this.logger.error(`Cloudinary upload failed: ${detail?.http_code ?? ''} ${detail?.message ?? 'unknown'}`);
                reject(new BusinessException(ErrorCode.UPLOAD_FAILED, 'Không tải được ảnh lên kho lưu trữ, vui lòng thử lại', HttpStatus.BAD_GATEWAY));
            };
            try {
                const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image', overwrite: false }, (error, result) => {
                    if (error || !result)
                        return fail(error);
                    resolve({ url: result.secure_url, publicId: result.public_id });
                });
                stream.end(data);
            }
            catch (error) {
                fail(error);
            }
        });
    }
    async delete(publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    }
    configure(rawUrl) {
        if (!rawUrl?.trim())
            return false;
        try {
            const url = new URL(rawUrl.trim());
            if (url.protocol !== 'cloudinary:' || !url.username || !url.password || !url.hostname)
                throw new Error('format');
            cloudinary.config({
                cloud_name: url.hostname,
                api_key: decodeURIComponent(url.username),
                api_secret: decodeURIComponent(url.password),
                secure: true,
            });
            return true;
        }
        catch {
            this.logger.warn('CLOUDINARY_URL không đúng định dạng cloudinary://key:secret@cloud_name, tính năng tải ảnh bị tắt');
            return false;
        }
    }
};
CloudinaryImageStorage = CloudinaryImageStorage_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], CloudinaryImageStorage);
export { CloudinaryImageStorage };
//# sourceMappingURL=cloudinary-image-storage.js.map