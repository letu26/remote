import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception.js';
import type { ErrorCode, ErrorDetail } from './error-codes.js';

/** Lỗi nghiệp vụ: xung đột (409), không tìm thấy (404), OTP sai (400), quá giới hạn (429)... */
export class BusinessException extends AppException {
  constructor(
    code: ErrorCode,
    message: string,
    status: number = HttpStatus.BAD_REQUEST,
    extra?: Record<string, unknown>,
    details?: ErrorDetail[],
  ) {
    super(code, message, status, details, extra);
  }
}
