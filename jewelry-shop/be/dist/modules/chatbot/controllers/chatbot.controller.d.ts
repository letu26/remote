import type { Request } from 'express';
import { AskChatbotDto } from '../dtos/chatbot.dtos.js';
import { ChatbotService } from '../services/chatbot.service.js';
export declare class ChatbotController {
    private readonly service;
    constructor(service: ChatbotService);
    suggestions(): Promise<{
        greeting: string;
        suggestions: import("../services/chatbot.service.js").Suggestion[];
    }>;
    ask(req: Request, dto: AskChatbotDto): Promise<{
        answer: string;
        matched: import("../services/chatbot.service.js").Suggestion;
        suggestions: import("../services/chatbot.service.js").Suggestion[];
        fallback: boolean;
    } | {
        answer: string;
        matched: null;
        suggestions: import("../services/chatbot.service.js").Suggestion[];
        fallback: boolean;
    }>;
}
