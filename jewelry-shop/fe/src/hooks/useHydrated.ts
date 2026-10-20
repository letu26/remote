"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** false khi render phía server và lần hydrate đầu, true sau đó. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
