import { RedisService } from '../../redis/services/redis.service.js';
export type OtpAttemptResult = {
    status: 'missing';
} | {
    status: 'wrong';
    attempts: number;
} | {
    status: 'locked';
};
export declare class OtpRepository {
    private readonly redis;
    constructor(redis: RedisService);
    private otpKey;
    private cooldownKey;
    acquireCooldown(emailHash: string, ttlSeconds: number): Promise<number>;
    saveOtp(emailHash: string, hash: string, ttlSeconds: number): Promise<void>;
    findOtpHash(emailHash: string): Promise<string | null>;
    registerWrongAttempt(emailHash: string, maxAttempts: number): Promise<OtpAttemptResult>;
    consumeOtp(emailHash: string): Promise<boolean>;
}
