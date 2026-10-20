import type { ChatSuggestion } from "@/types/cms";

export interface ChatMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  suggestions?: ChatSuggestion[];
  /** Tin lỗi do giao diện tạo (mạng, giới hạn tốc độ). */
  error?: boolean;
}

export const CHAT_HISTORY_KEY = "chat.history";
export const CHAT_MAX_MESSAGES = 40;
export const CHAT_MAX_LENGTH = 300;

/** Đọc lịch sử từ sessionStorage; dữ liệu hỏng hoặc storage bị chặn thì trả mảng rỗng. */
export function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (m): m is ChatMessage =>
          m && typeof m.id === "number" && (m.role === "user" || m.role === "bot") && typeof m.text === "string",
      )
      .slice(-CHAT_MAX_MESSAGES);
  } catch {
    return [];
  }
}

/** Lưu tối đa CHAT_MAX_MESSAGES tin gần nhất. */
export function saveHistory(messages: ChatMessage[]) {
  try {
    window.sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-CHAT_MAX_MESSAGES)));
  } catch {
    /* storage có thể bị chặn */
  }
}

export function clearHistory() {
  try {
    window.sessionStorage.removeItem(CHAT_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}
