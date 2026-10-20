"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ChatIcon, CloseIcon } from "@/components/ui/Icons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useCountdown } from "@/hooks/useCountdown";
import { chatbotService } from "@/services/chatbot.service";
import { useSiteInfo } from "@/store/site-store";
import type { ChatSuggestion } from "@/types/cms";
import {
  CHAT_MAX_LENGTH,
  CHAT_MAX_MESSAGES,
  clearHistory,
  loadHistory,
  saveHistory,
  type ChatMessage,
} from "@/utils/chat-history";
import { isApiError } from "@/utils/errors";
import { notify } from "@/utils/notify";

const DEFAULT_GREETING = "Xin chào! Mình có thể giúp bạn giải đáp về sản phẩm, bảo hành, đổi trả và giao hàng.";

function Suggestions({ items, disabled, onPick }: { items: ChatSuggestion[]; disabled: boolean; onPick: (q: string) => void }) {
  if (items.length === 0) return null;
  return (
    <ul aria-label="Câu hỏi gợi ý" className="mt-2 flex flex-wrap gap-1.5">
      {items.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(s.question)}
            className="rounded-full border border-gold-deep px-3 py-1 text-left text-xs text-gold-deep hover:bg-gold-tint disabled:opacity-50"
          >
            {s.question}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Chatbot CSKH theo từ khóa: gợi ý, hỏi đáp, lịch sử trong sessionStorage. */
export function ChatWidget() {
  const info = useSiteInfo();
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [until, setUntil] = useState<number | null>(null);
  const wait = useCountdown(until);
  const lock = useRef(false);
  const nextId = useRef(Math.max(0, ...loadHistory().map((m) => m.id)) + 1);
  const input = useRef<HTMLTextAreaElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);

  const intro = useAsyncData(`chat-suggestions-${everOpened}`, () =>
    everOpened ? chatbotService.suggestions() : Promise.resolve(null),
  );

  useEffect(() => {
    saveHistory(messages);
    log.current?.scrollTo?.({ top: log.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const push = (m: Omit<ChatMessage, "id">) =>
    setMessages((prev) => [...prev, { ...m, id: nextId.current++ }].slice(-CHAT_MAX_MESSAGES));

  const close = () => {
    setOpen(false);
    launcher.current?.focus();
  };

  const send = async (raw: string) => {
    const q = raw.trim();
    if (!q || q.length > CHAT_MAX_LENGTH || lock.current || wait > 0) return;
    lock.current = true;
    setPending(true);
    setText("");
    push({ role: "user", text: q });
    try {
      const res = await chatbotService.ask(q);
      push({ role: "bot", text: res.answer, suggestions: res.suggestions });
    } catch (err) {
      if (isApiError(err) && err.code === "RATE_LIMITED") {
        const secs = err.retryAfterSeconds && err.retryAfterSeconds > 0 ? err.retryAfterSeconds : 30;
        notify("warning", `Bạn hỏi quá nhanh, vui lòng thử lại sau ${secs} giây`);
        setUntil(Date.now() + secs * 1000);
        push({ role: "bot", text: `Bạn hỏi quá nhanh. Vui lòng đợi ${secs} giây rồi hỏi tiếp.`, error: true });
      } else {
        push({ role: "bot", text: "Không kết nối được máy chủ. Vui lòng thử lại sau.", error: true });
      }
    } finally {
      lock.current = false;
      setPending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(text);
    }
  };

  const clear = () => {
    clearHistory();
    setMessages([]);
  };

  const greeting = intro.data?.greeting ?? DEFAULT_GREETING;
  const blocked = pending || wait > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="Chat với tư vấn viên"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
          className="anim-fade flex h-112 max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-lg border border-line bg-paper shadow-pop"
        >
          <header className="flex items-center justify-between gap-2 bg-gold-deep px-4 py-3 text-white">
            <div className="min-w-0">
              <h2 className="font-serif text-lg">Tư vấn trang sức</h2>
              <p className="truncate text-xs opacity-90">Hotline {info.hotline}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {messages.length > 0 && (
                <button type="button" onClick={clear} className="rounded-ui px-2 py-1 text-xs hover:bg-white/15">
                  Xóa hội thoại
                </button>
              )}
              <button type="button" onClick={close} aria-label="Đóng khung chat" className="rounded-ui p-1 hover:bg-white/15">
                <CloseIcon width={18} height={18} />
              </button>
            </div>
          </header>

          <div
            ref={log}
            role="log"
            aria-live="polite"
            aria-label="Nội dung hội thoại"
            className="flex-1 space-y-3 overflow-y-auto bg-page p-4 text-sm"
          >
            <div>
              <p className="max-w-[88%] whitespace-pre-line wrap-break-word rounded-lg rounded-tl-none bg-sand px-3 py-2 text-ink">{greeting}</p>
              <Suggestions items={intro.data?.suggestions ?? []} disabled={blocked} onPick={(q) => void send(q)} />
            </div>
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className="max-w-[88%]">
                  {/* Văn bản thuần, giữ xuống dòng; không render HTML/Markdown. */}
                  <p
                    className={`whitespace-pre-line wrap-break-word rounded-lg px-3 py-2 ${
                      m.role === "user"
                        ? "rounded-tr-none bg-gold-deep text-white"
                        : m.error
                          ? "rounded-tl-none border border-danger/40 bg-danger/5 text-danger"
                          : "rounded-tl-none bg-sand text-ink"
                    }`}
                  >
                    {m.text}
                  </p>
                  {m.role === "bot" && m.suggestions && (
                    <Suggestions items={m.suggestions} disabled={blocked} onPick={(q) => void send(q)} />
                  )}
                </div>
              </div>
            ))}
            {pending && (
              <p role="status" className="text-xs italic text-muted">Đang trả lời...</p>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-line bg-paper p-3">
            <div className="flex items-end gap-2">
              <label htmlFor="chat-input" className="sr-only">Nhập câu hỏi</label>
              <textarea
                id="chat-input"
                ref={input}
                rows={2}
                value={text}
                maxLength={CHAT_MAX_LENGTH}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Nhập câu hỏi..."
                className="min-w-0 flex-1 resize-none rounded-ui border border-line-strong bg-paper px-3 py-2 text-sm outline-none focus:border-gold-deep focus:ring-2 focus:ring-gold/30"
              />
              <button
                type="submit"
                disabled={blocked || text.trim() === ""}
                className="rounded-ui bg-gold-deep px-4 py-2 text-sm font-semibold text-white hover:bg-gold-deeper disabled:cursor-not-allowed disabled:opacity-60"
              >
                {wait > 0 ? `Chờ ${wait}s` : "Gửi"}
              </button>
            </div>
            <p className="mt-1 text-right text-xs text-muted" aria-live="off">
              {text.length}/{CHAT_MAX_LENGTH}
            </p>
          </form>
        </section>
      )}
      <button
        ref={launcher}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setEverOpened(true);
        }}
        aria-expanded={open}
        aria-label={open ? "Đóng chat tư vấn" : "Mở chat tư vấn"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-deep text-white shadow-pop transition-transform hover:scale-105 hover:bg-gold-deeper"
      >
        {open ? <CloseIcon width={24} height={24} /> : <ChatIcon width={26} height={26} />}
      </button>
    </div>
  );
}
