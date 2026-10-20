import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception.js';
import { ErrorCode } from './error-codes.js';
export class AccessDeniedException extends AppException {
    constructor(message = 'Bạn không có quyền truy cập chức năng này', code = ErrorCode.FORBIDDEN) {
        super(code, message, HttpStatus.FORBIDDEN);
    }
}
//# sourceMappingURL=access-denied.exception.js.map