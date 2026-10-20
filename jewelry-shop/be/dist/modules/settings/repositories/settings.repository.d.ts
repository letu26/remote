import { DataSource } from 'typeorm';
export declare class SettingsRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findByKeys(keys: readonly string[]): Promise<Map<string, string>>;
    upsertMany(entries: Record<string, string>): Promise<void>;
}
