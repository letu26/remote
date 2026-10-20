import type { ReactNode } from "react";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/** Layout trang khách hàng: Header + nội dung + Footer + nút chat nổi. */
export function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#noi-dung"
        className="sr-only z-80 rounded-ui bg-gold-deep px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Bỏ qua tới nội dung chính
      </a>
      <SiteHeader />
      <main id="noi-dung" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}
