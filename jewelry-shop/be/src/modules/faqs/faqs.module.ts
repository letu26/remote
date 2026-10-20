import { Module } from '@nestjs/common';
import { FaqAdminController, FaqController } from './controllers/faq.controllers.js';
import { FaqRepository } from './repositories/faq.repository.js';
import { FaqService } from './services/faq.service.js';

@Module({
  controllers: [FaqController, FaqAdminController],
  providers: [FaqService, FaqRepository],
  exports: [FaqRepository],
})
export class FaqsModule {}
