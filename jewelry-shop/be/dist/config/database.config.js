import { readFileSync } from 'node:fs';
export function buildDatabaseConfig(config) {
    const sslEnabled = config.get('DB_SSL') === 'true';
    const caPath = config.get('DB_SSL_CA');
    return {
        type: 'mysql',
        host: config.getOrThrow('DB_HOST'),
        port: Number(config.getOrThrow('DB_PORT')),
        username: config.getOrThrow('DB_USER'),
        password: config.getOrThrow('DB_PASSWORD'),
        database: config.getOrThrow('DB_NAME'),
        ssl: sslEnabled
            ? caPath
                ? { ca: readFileSync(caPath, 'utf8') }
                : { rejectUnauthorized: false }
            : undefined,
        autoLoadEntities: true,
        synchronize: false,
        charset: 'utf8mb4',
        timezone: 'Z',
    };
}
//# sourceMappingURL=database.config.js.map