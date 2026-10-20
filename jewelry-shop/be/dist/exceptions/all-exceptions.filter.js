var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AppException } from './app.exception.js';
import { ErrorCode } from './error-codes.js';
const CODE_BY_STATUS = {
    [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
    [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
    [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
    [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
};
const MESSAGE_BY_STATUS = {
    [HttpStatus.BAD_REQUEST]: 'Dữ liệu không hợp lệ',
    [HttpStatus.UNAUTHORIZED]: 'Bạn chưa đăng nhập',
    [HttpStatus.FORBIDDEN]: 'Bạn không có quyền truy cập chức năng này',
    [HttpStatus.NOT_FOUND]: 'Không tìm thấy tài nguyên yêu cầu',
};
let AllExceptionsFilter = class AllExceptionsFilter {
    logger = new Logger('ExceptionFilter');
    catch(exception, host) {
        const http = host.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        const body = this.toBody(exception);
        const path = request.originalUrl.split('?')[0];
        if (body.statusCode >= 500) {
            const stack = exception instanceof Error ? exception.stack : String(exception);
            this.logger.error(`${request.method} ${path} -> ${body.statusCode} ${body.code}`, stack);
        }
        else {
            this.logger.warn(`${request.method} ${path} -> ${body.statusCode} ${body.code}`);
        }
        response.status(body.statusCode).json({ ...body, timestamp: new Date().toISOString(), path });
    }
    toBody(exception) {
        if (exception instanceof AppException) {
            return {
                statusCode: exception.getStatus(),
                code: exception.code,
                message: exception.message,
                ...(exception.details ? { details: exception.details } : {}),
                ...exception.extra,
            };
        }
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            return {
                statusCode: status,
                code: CODE_BY_STATUS[status] ?? (status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.VALIDATION_ERROR),
                message: MESSAGE_BY_STATUS[status] ?? 'Yêu cầu không hợp lệ',
            };
        }
        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Hệ thống đang gặp sự cố, vui lòng thử lại sau',
        };
    }
};
AllExceptionsFilter = __decorate([
    Catch()
], AllExceptionsFilter);
export { AllExceptionsFilter };
//# sourceMappingURL=all-exceptions.filter.js.map