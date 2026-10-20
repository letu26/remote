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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,#f6ecd0_0%,#fbf8f1_65%)] px-4 py-10">
      <BrandLogo className="mb-5" />
      <div className="w-full max-w-md rounded-lg border border-line bg-paper p-5 shadow-pop sm:p-7">
        <h1 className="font-serif text-3xl text-ink">{title}</h1>
        <div className="mt-2 h-px w-12 bg-gold" />
        {subtitle && <p className="mt-3 text-sm text-muted">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </main>
  );
}
