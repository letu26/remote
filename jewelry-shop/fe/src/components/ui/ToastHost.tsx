"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { consumeFlash } from "@/utils/flash";
import { notify, subscribeNotice, type NotifyKind } from "@/utils/notify";

const MAX_TOASTS = 4;
const DURATION: Record<NotifyKind, number> = { success: 4000, info: 4000, warning: 5000, error: 6000 };

const tone: Record<NotifyKind, string> = {
  error: "border-danger/50 text-danger",
  success: "border-success/50 text-success",
  warning: "border-gold-deep/70 text-gold-deeper",
  info: "border-gold-deep/50 text-gold-deeper",
};
const label: Record<NotifyKind, string> = {
  error: "Lỗi",
  success: "Thành công",
  warning: "Lưu ý",
  info: "Thông tin",
};

interface Toast {
  id: number;
  kind: NotifyKind;
  message: string;
  /** Tăng mỗi khi có thông báo trùng: đặt lại thời gian tự đóng thay vì thêm toast mới. */
  bump: number;
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(DURATION[toast.kind]);
  const lastBump = useRef(toast.bump);

  useEffect(() => {
    if (lastBump.current !== toast.bump) {
      lastBump.current = toast.bump;
      remaining.current = DURATION[toast.kind];
    }
    if (paused) return;
    const started = Date.now();
    const timer = setTimeout(() => onClose(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(500, remaining.current - (Date.now() - started));
    };
  }, [paused, toast.bump, toast.id, toast.kind, onClose]);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live={toast.kind === "error" ? "assertive" : "polite"}
      data-kind={toast.kind}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose(toast.id);
      }}
      className={`anim-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-ui border bg-paper px-3 py-2.5 text-sm shadow-pop ${tone[toast.kind]}`}
    >
      <p className="min-w-0 flex-1 break-words">
        <span className="sr-only">{label[toast.kind]}: </span>
        {toast.message}
      </p>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={() => onClose(toast.id)}
        className="-mr-1 shrink-0 rounded-ui px-1.5 text-lg leading-none text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-gold-deep"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  const pathname = usePathname();

  const close = useCallback((id: number) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  useEffect(
    () =>
      subscribeNotice((n) => {
        setItems((prev) => {
          const dup = prev.find((i) => i.kind === n.kind && i.message === n.message);
          if (dup) return prev.map((i) => (i === dup ? { ...i, bump: i.bump + 1 } : i));
          return [...prev, { ...n, bump: 0 }].slice(-MAX_TOASTS);
        });
      }),
    [],
  );

  // Thông báo sau redirect: đọc một lần mỗi khi vào trang mới (kể cả tải lại toàn bộ).
  useEffect(() => {
    const flash = consumeFlash();
    if (flash) notify(flash.kind, flash.message);
  }, [pathname]);

  return (
    <div
      aria-label="Thông báo"
      className="pointer-events-none fixed inset-x-4 top-4 z-70 flex flex-col items-center gap-2 sm:left-auto sm:right-4 sm:items-end"
    >
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={close} />
      ))}
    </div>
  );
}
