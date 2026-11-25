"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminStatsService } from "@/services/admin-stats.service";
import type { DateRange } from "@/types/admin-stats";

type Result = { key: string; text: string; failed: boolean };

/** AI phân tích doanh thu của khoảng ngày đang chọn; chỉ gọi khi bấm nút để tiết kiệm hạn mức. */
export function AiAnalysis({ range }: { range: DateRange }) {
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const key = `${range.from}|${range.to}`;
  // Đổi khoảng ngày thì bản phân tích cũ không còn đúng.
  const current = result?.key === key ? result : null;

  const run = async () => {
    setPending(true);
    try {
      const res = await adminStatsService.analysis(range);
      setResult({ key, text: res.analysis ?? res.message ?? "", failed: !res.analysis });
    } catch {
      setResult({ key, text: "Không phân tích được. Vui lòng thử lại.", failed: true });
    } finally {
      setPending(false);
    }
  };

  return (
    <section aria-label="AI phân tích doanh thu" className="rounded-lg border border-line bg-paper p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-xl text-ink">AI phân tích doanh thu</h2>
        <Button size="sm" onClick={() => void run()} disabled={pending}>
          {pending ? "Đang phân tích..." : "Phân tích kỳ đang chọn"}
        </Button>
      </div>
      {current && (
        <p aria-live="polite" className={`mt-3 whitespace-pre-line text-sm leading-relaxed ${current.failed ? "text-muted" : "text-ink"}`}>
          {current.text}
        </p>
      )}
    </section>
  );
}
