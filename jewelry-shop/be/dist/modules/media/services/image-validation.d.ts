export declare const MAX_IMAGE_BYTES: number;
export interface UploadedImageFile {
    buffer: Buffer;
    mimetype: string;
    size: number;
}
export declare function assertValidImageFile(file: UploadedImageFile): void;
