import { ConfigService } from '@nestjs/config';
import { ImageStorage, type StoredImage } from './image-storage.js';
export declare class CloudinaryImageStorage extends ImageStorage {
    private readonly logger;
    private readonly configured;
    constructor(config: ConfigService);
    isConfigured(): boolean;
    upload(data: Buffer, folder: string): Promise<StoredImage>;
    delete(publicId: string): Promise<void>;
    private configure;
}
