"use client";

import { useCallback, useSyncExternalStore } from "react";

const TICK_MS = 500;
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
};
const serverSnapshot = () => 0;

/**
 * Số giây còn lại tới mốc `targetMs` (ms). Đọc đồng hồ qua useSyncExternalStore nên chỉ chạy
 * ở client (snapshot server là 0), an toàn khi prerender và không cần setState trong effect.
 */
export function useCountdown(targetMs: number | null): number {
  const getSnapshot = useCallback(
    () => (targetMs === null ? 0 : Math.max(0, Math.ceil((targetMs - Date.now()) / 1000))),
    [targetMs],
  );
  return useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
