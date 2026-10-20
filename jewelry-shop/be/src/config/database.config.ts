import { readFileSync } from 'node:fs';
import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildDatabaseConfig(config: ConfigService): TypeOrmModuleOptions {
  const sslEnabled = config.get<string>('DB_SSL') === 'true';
  const caPath = config.get<string>('DB_SSL_CA');

  return {
    type: 'mysql',
    host: config.getOrThrow<string>('DB_HOST'),
    port: Number(config.getOrThrow<string>('DB_PORT')),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_NAME'),
    ssl: sslEnabled
      ? caPath
        ? { ca: readFileSync(caPath, 'utf8') }
        : { rejectUnauthorized: false }
      : undefined,
    autoLoadEntities: true,
    synchronize: false,
    charset: 'utf8mb4',
    // Date luôn đọc/ghi theo UTC, không phụ thuộc múi giờ máy chủ (DB lưu datetime theo UTC).
    timezone: 'Z',
  };
}
