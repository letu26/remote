"use client";

import { useState } from "react";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { inputClass } from "@/components/ui/Field";
import { MAX_CONTENT } from "./cms-validation";

/** Ô nhập Markdown với hai tab Soạn / Xem trước (xem trước dùng MarkdownContent, không render HTML thô). */
export function MarkdownEditor({
  label = "Nội dung (Markdown)",
  value,
  onChange,
  error,
  rows = 14,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
}) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const over = value.length > MAX_CONTENT;
  const tabClass = (active: boolean) =>
    `rounded-t-ui border border-b-0 px-3.5 py-1.5 text-sm font-medium ${
      active ? "border-line-strong bg-paper text-gold-deeper" : "border-transparent text-muted hover:text-ink"
    }`;

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <div role="tablist" aria-label="Chế độ nội dung" className="flex gap-1">
        <button type="button" role="tab" id="md-tab-edit" aria-selected={tab === "edit"} aria-controls="md-panel" onClick={() => setTab("edit")} className={tabClass(tab === "edit")}>
          Soạn
        </button>
        <button type="button" role="tab" id="md-tab-preview" aria-selected={tab === "preview"} aria-controls="md-panel" onClick={() => setTab("preview")} className={tabClass(tab === "preview")}>
          Xem trước
        </button>
      </div>
      <div id="md-panel" role="tabpanel" aria-labelledby={tab === "edit" ? "md-tab-edit" : "md-tab-preview"}>
        {tab === "edit" ? (
          <textarea
            aria-label={label}
            aria-invalid={!!error}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass(!!error)} font-mono`}
          />
        ) : (
          <div className="min-h-40 rounded-ui border border-line-strong bg-paper p-4" data-testid="md-preview">
            {value.trim() ? <MarkdownContent>{value}</MarkdownContent> : <p className="text-sm text-muted">Chưa có nội dung để xem trước.</p>}
          </div>
        )}
      </div>
      <div className="flex justify-between gap-2 text-xs">
        <span role={error ? "alert" : undefined} className="text-danger">{error}</span>
        <span className={over ? "font-semibold text-danger" : "text-muted"} data-testid="md-count">
          {value.length.toLocaleString("vi-VN")}/{MAX_CONTENT.toLocaleString("vi-VN")}
        </span>
      </div>
    </div>
  );
}
