import type { UploadedImageFile } from '../services/image-validation.js';
import { MediaUploadService } from '../services/media-upload.service.js';
export declare class MediaController {
    private readonly service;
    constructor(service: MediaUploadService);
    upload(file: UploadedImageFile | undefined): Promise<{
        url: string;
        publicId: string;
    }>;
}
