import { AppException } from './app.exception.js';
import { ErrorCode } from './error-codes.js';
export declare class AccessDeniedException extends AppException {
    constructor(message?: string, code?: ErrorCode);
}
