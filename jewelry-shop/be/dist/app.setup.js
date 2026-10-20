import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './exceptions/all-exceptions.filter.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';
import { createValidationPipe } from './utils/validation-pipe.factory.js';
export function configureApp(app) {
    const config = app.get(ConfigService);
    app.setGlobalPrefix('api');
    const trustProxy = Number(config.get('TRUST_PROXY') ?? 0);
    if (Number.isInteger(trustProxy) && trustProxy > 0) {
        app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);
    }
    app.use(requestLogger);
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    app.enableCors({
        origin: config.get('FRONTEND_URL') ?? 'http://localhost:3000',
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
}
//# sourceMappingURL=app.setup.js.map