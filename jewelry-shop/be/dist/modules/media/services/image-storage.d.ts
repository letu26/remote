export interface StoredImage {
    url: string;
    publicId: string;
}
export declare abstract class ImageStorage {
    abstract isConfigured(): boolean;
    abstract upload(data: Buffer, folder: string): Promise<StoredImage>;
    abstract delete(publicId: string): Promise<void>;
}
