import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { FaqsModule } from '../faqs/faqs.module.js';
import { SiteInfoModule } from '../site-info/site-info.module.js';
import { ChatbotController } from './controllers/chatbot.controller.js';
import { ChatbotRateLimitRepository } from './repositories/chatbot-rate-limit.repository.js';
import { ChatbotAiService } from './services/chatbot-ai.service.js';
import { ChatbotService } from './services/chatbot.service.js';

@Module({
  imports: [AiModule, CatalogModule, FaqsModule, SiteInfoModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotAiService, ChatbotRateLimitRepository],
})
export class ChatbotModule {}
