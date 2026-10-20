import type { ReactNode } from "react";

/** Chuyển trang nhẹ: chỉ opacity/transform, tự tắt khi prefers-reduced-motion (globals.css). */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="anim-page flex flex-1 flex-col">{children}</div>;
}
