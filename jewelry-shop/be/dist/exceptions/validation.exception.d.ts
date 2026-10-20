import { AppException } from './app.exception.js';
import { type ErrorDetail } from './error-codes.js';
export declare class ValidationException extends AppException {
    constructor(details: ErrorDetail[], message?: string);
}
