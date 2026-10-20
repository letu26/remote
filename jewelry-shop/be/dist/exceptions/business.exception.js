import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception.js';
export class BusinessException extends AppException {
    constructor(code, message, status = HttpStatus.BAD_REQUEST, extra, details) {
        super(code, message, status, details, extra);
    }
}
//# sourceMappingURL=business.exception.js.map