import type { Metadata } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond } from "next/font/google";
import { Suspense } from "react";
import { ShopSync } from "@/components/layout/ShopSync";
import { ToastHost } from "@/components/ui/ToastHost";
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from "@/constants";
import { AuthProvider } from "@/store/auth-context";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: `${BRAND_NAME} - ${BRAND_TAGLINE}`, template: `%s - ${BRAND_NAME}` },
  description: BRAND_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${cormorant.variable} h-full antialiased`}>
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
