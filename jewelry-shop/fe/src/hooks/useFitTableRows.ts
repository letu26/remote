"use client";

import { useEffect, type RefObject } from "react";

/**
 * Trang quản trị dạng bảng (xem .admin-fit trong globals.css): khung bảng luôn kéo dài gần tới phân trang; hook đo để phần
 * dưới cùng của khung là một dải trắng (--fit-gap) đúng bằng chỗ còn thừa sau dòng cuối cùng nhìn thấy đủ, nên không có
 * dòng nào bị cắt nửa chừng. Đo lại khi nội dung hoặc kích thước cửa sổ thay đổi.
 */
export function useFitTableRows(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return;
    let frame = 0;

    const fit = () => {
      const wraps = root.querySelectorAll<HTMLElement>(".overflow-x-auto");
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      wraps.forEach((wrap) => {
        const table = wrap.querySelector("table");
        if (!table) return;
        wrap.style.removeProperty("--fit-gap");
        if (!desktop) return;
        const minGap = parseFloat(getComputedStyle(wrap, "::after").height) || 0; // dải trắng tối thiểu (globals.css)
        const room = wrap.clientHeight;
        const head = table.tHead?.offsetHeight ?? 0;
        const rows = Array.from(table.tBodies[0]?.rows ?? []);
        let used = head;
        for (const row of rows) {
          if (used + row.offsetHeight + minGap > room) break;
          used += row.offsetHeight;
        }
        // Còn dòng bị tràn thì dải trắng chiếm toàn bộ phần thừa sau dòng cuối vừa khít; hết dòng thì giữ dải tối thiểu.
        if (used > head && used < table.offsetHeight) wrap.style.setProperty("--fit-gap", `${room - used}px`);
        wrap.style.scrollSnapType = "y proximity";
        wrap.style.scrollPaddingTop = `${head}px`;
        rows.forEach((row) => (row.style.scrollSnapAlign = "start"));
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    const mutation = new MutationObserver(schedule);
    mutation.observe(root, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [ref, enabled]);
}
