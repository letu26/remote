var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AdminOnly } from '../../../decorators/admin-only.decorator.js';
import { SingleImageUploadInterceptor } from '../interceptors/single-image-upload.interceptor.js';
import { MediaUploadService } from '../services/media-upload.service.js';
let MediaController = class MediaController {
    service;
    constructor(service) {
        this.service = service;
    }
    async upload(file) {
        const { url, publicId } = await this.service.uploadCmsImage(file);
        return { url, publicId };
    }
};
__decorate([
    Post('images'),
    UseInterceptors(SingleImageUploadInterceptor),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "upload", null);
MediaController = __decorate([
    Controller('admin/media'),
    AdminOnly(),
    __metadata("design:paramtypes", [MediaUploadService])
], MediaController);
export { MediaController };
//# sourceMappingURL=media.controller.js.map