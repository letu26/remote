import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception.js';
import type { ErrorCode } from './error-codes.js';

/** Lỗi xác thực: 401. */
export class AuthException extends AppException {
  constructor(code: ErrorCode, message: string) {
    super(code, message, HttpStatus.UNAUTHORIZED);
  }
}
