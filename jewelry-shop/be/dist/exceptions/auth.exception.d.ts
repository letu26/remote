import { AppException } from './app.exception.js';
import type { ErrorCode } from './error-codes.js';
export declare class AuthException extends AppException {
    constructor(code: ErrorCode, message: string);
}
