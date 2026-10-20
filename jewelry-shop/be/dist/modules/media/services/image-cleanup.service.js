var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ImageCleanupService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ImageStorage } from './image-storage.js';
let ImageCleanupService = ImageCleanupService_1 = class ImageCleanupService {
    storage;
    logger = new Logger(ImageCleanupService_1.name);
    constructor(storage) {
        this.storage = storage;
    }
    scheduleDeletion(publicIds) {
        if (!this.storage.isConfigured())
            return;
        for (const publicId of publicIds) {
            if (!publicId)
                continue;
            void Promise.resolve()
                .then(() => this.storage.delete(publicId))
                .catch((error) => this.logger.warn(`Không xóa được ảnh ${publicId}: ${error instanceof Error ? error.message : 'unknown'}`));
        }
    }
};
ImageCleanupService = ImageCleanupService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ImageStorage])
], ImageCleanupService);
export { ImageCleanupService };
//# sourceMappingURL=image-cleanup.service.js.map