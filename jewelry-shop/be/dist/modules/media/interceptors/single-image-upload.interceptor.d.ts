import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
export declare class SingleImageUploadInterceptor implements NestInterceptor {
    private readonly inner;
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>>;
}
