import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AskChatbotDto } from '../dtos/chatbot.dtos.js';
import { ChatbotService } from '../services/chatbot.service.js';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}

  @Get('suggestions')
  suggestions() {
    return this.service.suggestions();
  }

  /**
   * `req.ip` là địa chỉ kết nối TCP, trừ khi ứng dụng bật `trust proxy` (biến môi trường TRUST_PROXY,
   * xem app.setup.ts): khi đó Express mới đọc X-Forwarded-For từ các proxy đáng tin. Không tự đọc header ở đây
   * để client không giả mạo IP nhằm né giới hạn.
   */
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  ask(@Req() req: Request, @Body() dto: AskChatbotDto) {
    return this.service.ask(req.ip ?? 'unknown', dto.message);
  }
}
