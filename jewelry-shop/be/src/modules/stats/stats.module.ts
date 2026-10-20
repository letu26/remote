import { Module } from '@nestjs/common';
import { StatsController } from './controllers/stats.controller.js';
import { StatsRepository } from './repositories/stats.repository.js';
import { StatsService } from './services/stats.service.js';

@Module({
  controllers: [StatsController],
  providers: [StatsService, StatsRepository],
})
export class StatsModule {}
