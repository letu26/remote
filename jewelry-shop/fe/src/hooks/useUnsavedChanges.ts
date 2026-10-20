"use client";

import { useEffect } from "react";
import { confirmAction } from "@/utils/confirm";

export const UNSAVED_MESSAGE = "Bạn có thay đổi chưa lưu. Rời khỏi trang sẽ mất các thay đổi này. Bạn có chắc muốn rời đi?";

/**
 * Cảnh báo khi rời trang có thay đổi chưa lưu:
 * đóng/tải lại tab (beforeunload) và bấm liên kết nội bộ (xác nhận trước khi điều hướng).
 */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    let bypass = false;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (bypass) return;
      // Chặn điều hướng ngay, hỏi bằng hộp xác nhận, đồng ý thì bấm lại liên kết.
      e.preventDefault();
      e.stopPropagation();
      void confirmAction({
        title: "Rời khỏi trang?",
        text: UNSAVED_MESSAGE,
        confirmText: "Rời đi",
        cancelText: "Ở lại",
        tone: "danger",
      }).then((ok) => {
        if (!ok) return;
        bypass = true;
        anchor.click();
        bypass = false;
      });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    // capture: chạy trước bộ xử lý điều hướng của next/link.
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
