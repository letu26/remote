import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/** Đọc/ghi bảng site_settings theo khóa. Nơi gọi phải tự giới hạn danh sách khóa (whitelist). */
@Injectable()
export class SettingsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findByKeys(keys: readonly string[]): Promise<Map<string, string>> {
    const rows: { key: string; value: string }[] = await this.dataSource.query(
      'SELECT setting_key AS `key`, value FROM site_settings WHERE setting_key IN (?)',
      [keys],
    );
    return new Map(rows.map((row) => [row.key, row.value]));
  }

  async upsertMany(entries: Record<string, string>): Promise<void> {
    const pairs = Object.entries(entries);
    if (!pairs.length) return;
    await this.dataSource.query(
      'INSERT INTO site_settings (setting_key, value) VALUES ? ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [pairs],
    );
  }
}
