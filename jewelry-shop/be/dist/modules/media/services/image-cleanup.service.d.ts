import { ImageStorage } from './image-storage.js';
export declare class ImageCleanupService {
    private readonly storage;
    private readonly logger;
    constructor(storage: ImageStorage);
    scheduleDeletion(publicIds: (string | null | undefined)[]): void;
}
