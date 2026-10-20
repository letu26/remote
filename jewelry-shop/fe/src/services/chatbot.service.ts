import { http } from "@/services/http";
import type { ChatAnswer, ChatSuggestions } from "@/types/cms";

export const chatbotService = {
  suggestions: () => http.get<ChatSuggestions>("/chatbot/suggestions").then((r) => r.data),
  ask: (message: string) => http.post<ChatAnswer>("/chatbot/ask", { message }).then((r) => r.data),
};
