import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception.js';
import { ErrorCode } from './error-codes.js';

/** Lỗi không đủ quyền: 403. */
export class AccessDeniedException extends AppException {
  constructor(message = 'Bạn không có quyền truy cập chức năng này', code: ErrorCode = ErrorCode.FORBIDDEN) {
    super(code, message, HttpStatus.FORBIDDEN);
  }
}
