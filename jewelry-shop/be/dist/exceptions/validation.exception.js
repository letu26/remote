import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception.js';
import { ErrorCode } from './error-codes.js';
export class ValidationException extends AppException {
    constructor(details, message = 'Dữ liệu không hợp lệ') {
        super(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, details);
    }
}
//# sourceMappingURL=validation.exception.js.map