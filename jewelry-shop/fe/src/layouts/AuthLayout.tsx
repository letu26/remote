import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top_left,#f7edd2_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,#d6efe8_0%,transparent_60%)] px-4 py-10">
      <BrandLogo className="mb-5" />
      <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-pop sm:p-8">
        <h1 className="font-serif text-3xl text-ink">{title}</h1>
        <div className="mt-3 flex items-center gap-1.5" aria-hidden>
          <span className="h-0.5 w-10 rounded-full bg-gold-deep" />
          <span className="h-0.5 w-3 rounded-full bg-gold/60" />
        </div>
        {subtitle && <p className="mt-3 text-sm text-muted">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </main>
  );
}
