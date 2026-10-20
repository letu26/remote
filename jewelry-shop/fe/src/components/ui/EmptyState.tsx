import type { ReactNode } from "react";
import { BoxIcon } from "./Icons";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-paper px-5 py-8 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-tint text-gold-deep">
        <BoxIcon width={28} height={28} />
      </span>
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
