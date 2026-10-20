import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly logger;
    readonly client: Redis;
    constructor(config: ConfigService);
    onModuleDestroy(): Promise<void>;
}
