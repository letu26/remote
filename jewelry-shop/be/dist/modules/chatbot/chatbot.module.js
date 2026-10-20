var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { FaqsModule } from '../faqs/faqs.module.js';
import { SiteInfoModule } from '../site-info/site-info.module.js';
import { ChatbotController } from './controllers/chatbot.controller.js';
import { ChatbotRateLimitRepository } from './repositories/chatbot-rate-limit.repository.js';
import { ChatbotService } from './services/chatbot.service.js';
let ChatbotModule = class ChatbotModule {
};
ChatbotModule = __decorate([
    Module({
        imports: [FaqsModule, SiteInfoModule],
        controllers: [ChatbotController],
        providers: [ChatbotService, ChatbotRateLimitRepository],
    })
], ChatbotModule);
export { ChatbotModule };
//# sourceMappingURL=chatbot.module.js.map