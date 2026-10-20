import { HttpException } from '@nestjs/common';
export class AppException extends HttpException {
    code;
    details;
    extra;
    constructor(code, message, status, details, extra) {
        super({ code, message, details }, status);
        this.code = code;
        this.details = details;
        this.extra = extra;
    }
}
//# sourceMappingURL=app.exception.js.map