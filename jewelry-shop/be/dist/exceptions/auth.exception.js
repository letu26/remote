import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception.js';
export class AuthException extends AppException {
    constructor(code, message) {
        super(code, message, HttpStatus.UNAUTHORIZED);
    }
}
//# sourceMappingURL=auth.exception.js.map