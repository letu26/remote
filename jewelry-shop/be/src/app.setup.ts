import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './exceptions/all-exceptions.filter.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';
import { createValidationPipe } from './utils/validation-pipe.factory.js';

/** Cấu hình dùng chung cho main.ts và test e2e. */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  // Chỉ tin header X-Forwarded-For khi chạy sau reverse proxy đã khai báo (TRUST_PROXY = số proxy tin cậy).
  const trustProxy = Number(config.get<string>('TRUST_PROXY') ?? 0);
  if (Number.isInteger(trustProxy) && trustProxy > 0) {
    (app.getHttpAdapter().getInstance() as { set: (key: string, value: unknown) => void }).set('trust proxy', trustProxy);
  }
  app.use(requestLogger);
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });
}
