"use client";

import Link from "next/link";
import { useSiteInfo } from "@/store/site-store";

function GemMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden fill="none">
      <path d="M16 3 28 12 16 29 4 12Z" fill="var(--gold-tint)" stroke="var(--gold-deep)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 12h24M11 12 16 3l5 9-5 17-5-17Z" stroke="var(--gold-deep)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandLogo({ className = "" }: { className?: string }) {
  const BRAND_NAME = useSiteInfo().brandName;
  return (
    <Link href="/" aria-label={`${BRAND_NAME} - Trang chủ`} className={`inline-flex items-center gap-2 ${className}`}>
      <GemMark size={22} />
      <span className="font-serif text-xl font-semibold uppercase tracking-[0.14em] text-gold-deep sm:text-2xl">
        {BRAND_NAME}
      </span>
    </Link>
  );
}
