"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { formatDate, formatLocalDateTime } from "@/utils/format";

/** Ngày giờ theo múi giờ của người xem (sau hydrate); trước đó hiện ngày để HTML server khớp client. */
export function PublishedDate({ iso, className }: { iso: string; className?: string }) {
  const hydrated = useHydrated();
  return (
    <time dateTime={iso} className={className}>
      {hydrated ? formatLocalDateTime(iso) : formatDate(iso)}
    </time>
  );
}
