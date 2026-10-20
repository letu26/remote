import { RedisService } from '../../redis/services/redis.service.js';
export type IdempotencyState = {
    kind: 'acquired';
} | {
    kind: 'in_progress';
} | {
    kind: 'done';
    orderCode: string;
} | {
    kind: 'unavailable';
};
export declare class IdempotencyRepository {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    private keyOf;
    begin(userId: number, key: string): Promise<IdempotencyState>;
    complete(userId: number, key: string, orderCode: string): Promise<void>;
    release(userId: number, key: string): Promise<void>;
}
