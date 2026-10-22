"use client";

import { useId, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { cmsService } from "@/services/cms.service";
import type { Faq } from "@/types/cms";

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li className="border-b border-line last:border-b-0">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-btn`}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-medium text-ink hover:bg-gold-tint"
        >
          <span>{faq.question}</span>
          <span aria-hidden className="text-xl text-gold-deep">{open ? "−" : "+"}</span>
        </button>
      </h2>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`} hidden={!open} className="px-4 pb-4">
        {/* Văn bản thuần, giữ xuống dòng. */}
        <p className="whitespace-pre-line break-words text-sm leading-relaxed text-muted">{faq.answer}</p>
      </div>
    </li>
  );
}

export function FaqView() {
  const { data, loading, failed, reload } = useAsyncData("faqs", (signal) => cmsService.faqs(signal));
  if (failed) return <ErrorState onRetry={reload} />;
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }
  if (!data || data.length === 0) return <EmptyState title="Chưa có câu hỏi nào" />;
  return (
    <ul className="overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
      {data.map((f) => <FaqItem key={f.id} faq={f} />)}
    </ul>
  );
}
