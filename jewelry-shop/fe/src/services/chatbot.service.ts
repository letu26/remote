import { http } from "@/services/http";
import type { ChatAnswer, ChatSuggestions } from "@/types/cms";

export const chatbotService = {
  suggestions: () => http.get<ChatSuggestions>("/chatbot/suggestions").then((r) => r.data),
  // AI trả lời lâu hơn các API thường nên đặt thời gian chờ dài hơn.
  ask: (message: string, history?: { role: "user" | "bot"; text: string }[]) =>
    http.post<ChatAnswer>("/chatbot/ask", { message, history }, { timeout: 30000 }).then((r) => r.data),
};
