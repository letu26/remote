"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./Icons";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Hộp thoại giữa màn hình: Esc đóng, Tab xoay vòng, trả focus về nút mở khi đóng. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  role = "dialog",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  role?: "dialog" | "alertdialog";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Ưu tiên ô nhập đầu tiên trong thân hộp thoại, không phải nút Đóng.
    const body = panel.current?.querySelector<HTMLElement>("[data-modal-body]");
    (body?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        return onCloseRef.current();
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="anim-fade absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        className={`anim-pop relative flex max-h-[92vh] w-full ${width} flex-col rounded-t-lg bg-page shadow-pop sm:rounded-lg`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id={titleId} className="font-serif text-xl text-ink">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-ui p-2 text-muted transition-colors hover:bg-sand hover:text-ink">
            <CloseIcon />
          </button>
        </div>
        <div data-modal-body className="flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-4 py-2.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
