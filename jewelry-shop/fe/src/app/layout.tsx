import type { Metadata } from "next";
import { Lora } from "next/font/google";
import { Suspense } from "react";
import { ShopSync } from "@/components/layout/ShopSync";
import { ToastHost } from "@/components/ui/ToastHost";
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from "@/constants";
import { AuthProvider } from "@/store/auth-context";
import "./globals.css";

// Một phông duy nhất (Lora) cho toàn site, giống dự án datn_healthcare_fe.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: `${BRAND_NAME} - ${BRAND_TAGLINE}`, template: `%s - ${BRAND_NAME}` },
  description: BRAND_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${lora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          {children}
          <ShopSync />
          <Suspense fallback={null}>
            <ToastHost />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
