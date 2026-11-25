import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { StatsController } from './controllers/stats.controller.js';
import { StatsRepository } from './repositories/stats.repository.js';
import { RevenueAnalysisService } from './services/revenue-analysis.service.js';
import { StatsService } from './services/stats.service.js';

@Module({
  imports: [AiModule],
  controllers: [StatsController],
  providers: [StatsService, RevenueAnalysisService, StatsRepository],
})
export class StatsModule {}
