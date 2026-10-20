import { AppException } from './app.exception.js';
import type { ErrorCode, ErrorDetail } from './error-codes.js';
export declare class BusinessException extends AppException {
    constructor(code: ErrorCode, message: string, status?: number, extra?: Record<string, unknown>, details?: ErrorDetail[]);
}
