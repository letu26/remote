import { Module } from '@nestjs/common';
import { GeminiGateway } from './services/gemini-gateway.service.js';

@Module({
  providers: [GeminiGateway],
  exports: [GeminiGateway],
})
export class AiModule {}
