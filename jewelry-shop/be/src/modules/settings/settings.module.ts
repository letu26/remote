import { Module } from '@nestjs/common';
import { SettingsRepository } from './repositories/settings.repository.js';

@Module({ providers: [SettingsRepository], exports: [SettingsRepository] })
export class SettingsModule {}
