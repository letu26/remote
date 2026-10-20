import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppException } from './app.exception.js';
import { ErrorCode, type ErrorDetail } from './error-codes.js';

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
};

const MESSAGE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Dữ liệu không hợp lệ',
  [HttpStatus.UNAUTHORIZED]: 'Bạn chưa đăng nhập',
  [HttpStatus.FORBIDDEN]: 'Bạn không có quyền truy cập chức năng này',
  [HttpStatus.NOT_FOUND]: 'Không tìm thấy tài nguyên yêu cầu',
};

interface ErrorBody {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: ErrorDetail[];
  [extra: string]: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const body = this.toBody(exception);
    const path = request.originalUrl.split('?')[0];
    if (body.statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${path} -> ${body.statusCode} ${body.code}`, stack);
    } else {
      this.logger.warn(`${request.method} ${path} -> ${body.statusCode} ${body.code}`);
    }

    response.status(body.statusCode).json({ ...body, timestamp: new Date().toISOString(), path });
  }

  private toBody(exception: unknown): ErrorBody {
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
}
