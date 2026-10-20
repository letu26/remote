import { ConfigService } from '@nestjs/config';
import { ImageStorage, type StoredImage } from './image-storage.js';
import { type UploadedImageFile } from './image-validation.js';
export declare class MediaUploadService {
    private readonly storage;
    private readonly folder;
    constructor(storage: ImageStorage, config: ConfigService);
    uploadCmsImage(file: UploadedImageFile | undefined): Promise<StoredImage>;
}
