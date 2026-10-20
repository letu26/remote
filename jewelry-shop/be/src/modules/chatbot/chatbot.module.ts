import { Module } from '@nestjs/common';
import { FaqsModule } from '../faqs/faqs.module.js';
import { SiteInfoModule } from '../site-info/site-info.module.js';
import { ChatbotController } from './controllers/chatbot.controller.js';
import { ChatbotRateLimitRepository } from './repositories/chatbot-rate-limit.repository.js';
import { ChatbotService } from './services/chatbot.service.js';

@Module({
  imports: [FaqsModule, SiteInfoModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotRateLimitRepository],
})
export class ChatbotModule {}
