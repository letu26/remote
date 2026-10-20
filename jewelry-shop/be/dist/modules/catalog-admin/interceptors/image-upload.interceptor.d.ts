import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
export declare const MAX_IMAGE_BYTES: number;
export declare const MAX_FILES_PER_REQUEST = 8;
export declare const UPLOAD_FIELD = "files";
export declare class ImageUploadInterceptor implements NestInterceptor {
    private readonly inner;
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>>;
    private translate;
}
