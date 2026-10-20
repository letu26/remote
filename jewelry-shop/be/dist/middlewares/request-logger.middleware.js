import { Logger } from '@nestjs/common';
const logger = new Logger('HTTP');
export function requestLogger(req, res, next) {
    const startedAt = Date.now();
    res.on('finish', () => {
        logger.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - startedAt}ms`);
    });
    next();
}
//# sourceMappingURL=request-logger.middleware.js.map