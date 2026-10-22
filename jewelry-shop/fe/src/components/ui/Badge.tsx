import type { ReactNode } from "react";

const tones = {
  sale: "bg-sale text-white",
  soldout: "bg-ink/80 text-white",
  gold: "bg-gold-tint text-gold-deeper border border-gold/50",
  success: "bg-success/10 text-success",
  neutral: "bg-sand text-muted",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
