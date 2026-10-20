import { HttpException } from '@nestjs/common';
import type { ErrorCode, ErrorDetail } from './error-codes.js';

/** Lớp gốc cho mọi lỗi nghiệp vụ có mã lỗi riêng. */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: number,
    readonly details?: ErrorDetail[],
    /** Trường bổ sung đưa vào body lỗi (ví dụ retryAfterSeconds). */
    readonly extra?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}
