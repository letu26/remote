import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

/** Chỉ ghi method, đường dẫn (không query), status, thời gian. Không ghi body/header. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  res.on('finish', () => {
    logger.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
}
