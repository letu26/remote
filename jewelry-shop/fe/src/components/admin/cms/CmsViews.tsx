"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Field } from "@/components/ui/Field";
import { adminFaqService } from "@/services/admin-cms.service";
import type { ChatbotAnswer, MenuPlacement } from "@/types/admin-cms";
import { isApiError } from "@/utils/errors";
import { notify } from "@/utils/notify";
import { adminErrorMessage } from "../admin-errors";
import { CrudPage } from "../CrudPage";
import { bannerConfig, faqConfig, menuConfigs, pageConfig } from "./cms-configs";

export const BannersView = () => <CrudPage config={bannerConfig} />;
export const PagesView = () => <CrudPage config={pageConfig} />;

const TABS: { value: MenuPlacement; label: string }[] = [
  { value: "header", label: "Đầu trang" },
  { value: "footer", label: "Chân trang" },
];

export function MenusView() {
  const [placement, setPlacement] = useState<MenuPlacement>("header");
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Vị trí menu" className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={placement === t.value}
            onClick={() => setPlacement(t.value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              placement === t.value ? "border-gold-deep text-gold-deeper" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* key: đổi tab thì dựng lại khung CRUD với cấu hình của vị trí tương ứng */}
      <CrudPage key={placement} config={menuConfigs[placement]} />
    </div>
  );
}

/** Khối thử chatbot: hỏi như khách và xem câu trả lời, FAQ khớp, gợi ý. */
export function ChatbotTester() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ChatbotAnswer | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = async (text: string) => {
    const msg = text.trim();
    if (!msg) {
      setError("Vui lòng nhập câu hỏi");
      return;
    }
    if (msg.length > 300) {
      setError("Câu hỏi tối đa 300 ký tự");
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setResult(await adminFaqService.ask(msg));
    } catch (e) {
      if (isApiError(e) && e.code === "RATE_LIMITED") {
        const wait = e.retryAfterSeconds ? ` Vui lòng thử lại sau ${e.retryAfterSeconds} giây.` : "";
        setError(`Hỏi quá nhiều lần.${wait}`);
        notify("warning", `Hỏi quá nhiều lần.${wait}`);
      } else {
        setError(adminErrorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(message);
  };

  return (
    <section aria-label="Thử chatbot" className="space-y-3 rounded-lg border border-line bg-paper p-4 shadow-card">
      <h2 className="font-serif text-xl text-ink">Thử chatbot</h2>
      <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-end gap-2">
        <div className="min-w-60 flex-1">
          <Field label="Câu hỏi của khách" name="chatbot-message" value={message} maxLength={300} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <Button type="submit" loading={busy}>Hỏi thử</Button>
      </form>
      {error && <Alert>{error}</Alert>}
      {result && (
        <div className="space-y-2 text-sm" aria-live="polite">
          <p className="whitespace-pre-wrap rounded-ui bg-sand p-3 text-ink" data-testid="chatbot-answer">{result.answer}</p>
          <p className="text-xs text-muted">
            {result.fallback ? "Không khớp FAQ nào (trả lời dự phòng)." : `Khớp FAQ: ${result.matched?.question ?? ""}`}
          </p>
          {result.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted">Gợi ý kèm theo:</p>
              <ul className="mt-1 list-inside list-disc text-xs text-ink">
                {result.suggestions.map((s) => (
                  <li key={s.id}>{s.question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function FaqsView() {
  return (
    <div className="space-y-5">
      <CrudPage config={faqConfig} />
      <ChatbotTester />
    </div>
  );
}
