import { HttpStatus } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { detectImageKind, MIME_BY_KIND } from '../../../utils/image-signature.util.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/** Kiểm tra bằng chữ ký file (magic bytes) + MIME khớp + dung lượng; không tin tên/đuôi file. */
export function assertValidImageFile(file: UploadedImageFile): void {
  const kind = detectImageKind(file.buffer);
  if (!kind || MIME_BY_KIND[kind] !== file.mimetype) {
    throw new BusinessException(ErrorCode.INVALID_IMAGE, 'Chỉ nhận ảnh JPG, PNG hoặc WEBP hợp lệ', HttpStatus.BAD_REQUEST);
  }
  if (file.buffer.length > MAX_IMAGE_BYTES) {
    throw new BusinessException(ErrorCode.INVALID_IMAGE, 'Mỗi ảnh tối đa 5MB', HttpStatus.BAD_REQUEST);
  }
}
