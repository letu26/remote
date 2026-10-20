export interface StoredImage {
  url: string;
  publicId: string;
}

/** Cổng lưu trữ ảnh: đổi nhà cung cấp (Cloudinary, S3...) không phải sửa service nghiệp vụ. */
export abstract class ImageStorage {
  abstract isConfigured(): boolean;
  /** Ném UploadFailedException nếu nhà cung cấp lỗi. */
  abstract upload(data: Buffer, folder: string): Promise<StoredImage>;
  abstract delete(publicId: string): Promise<void>;
}
