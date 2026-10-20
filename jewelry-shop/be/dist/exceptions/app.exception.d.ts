import { HttpException } from '@nestjs/common';
import type { ErrorCode, ErrorDetail } from './error-codes.js';
export declare class AppException extends HttpException {
    readonly code: ErrorCode;
    readonly details?: ErrorDetail[] | undefined;
    readonly extra?: Record<string, unknown> | undefined;
    constructor(code: ErrorCode, message: string, status: number, details?: ErrorDetail[] | undefined, extra?: Record<string, unknown> | undefined);
}
