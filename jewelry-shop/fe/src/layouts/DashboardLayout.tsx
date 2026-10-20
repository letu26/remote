"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES } from "@/constants";
import { ShopLayout } from "@/layouts/ShopLayout";
import { useAuth } from "@/store/auth-context";

// Mục có `href` là trang đã làm; mục không có `href` là giai đoạn sau, hiển thị mờ.
const ADMIN_MENU: { label: string; href?: string }[] = [
  { label: "Tổng quan", href: "/admin" },
  { label: "Sản phẩm", href: "/admin/products" },
  { label: "Danh mục", href: "/admin/categories" },
  { label: "Chất liệu", href: "/admin/materials" },
  { label: "Loại đá", href: "/admin/gemstones" },
  { label: "Bộ sưu tập", href: "/admin/collections" },
  { label: "Đơn hàng", href: "/admin/orders" },
  { label: "Đánh giá", href: "/admin/reviews" },
  { label: "Bài viết", href: "/admin/articles" },
  { label: "Trang nội dung", href: "/admin/pages" },
  { label: "Hỏi đáp", href: "/admin/faqs" },
  { label: "Banner", href: "/admin/banners" },
  { label: "Menu", href: "/admin/menus" },
  { label: "Vận chuyển", href: "/admin/shipping-methods" },
  { label: "Cài đặt", href: "/admin/settings" },
  { label: "Khách hàng", href: "/admin/customers" },
  { label: "Khuyến mại", href: "/admin/promotions" },
];

function LogoutLink({ size }: { size?: "sm" | "md" }) {
  return (
    <ButtonLink href={ROUTES.logout} prefetch={false} variant="secondary" size={size}>
      Đăng xuất
    </ButtonLink>
  );
}

function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <div className="min-h-screen bg-page lg:flex">
      <aside className="border-b border-line bg-paper lg:min-h-screen lg:w-52 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-3 py-2.5 lg:block lg:py-4">
          <BrandLogo />
          <span className="rounded-full bg-gold-tint px-2 py-0.5 text-[11px] font-semibold text-gold-deeper lg:mt-2 lg:inline-block">
            Quản trị
          </span>
        </div>
        <nav aria-label="Menu quản trị" className="overflow-x-auto px-2 pb-2 lg:px-2 lg:pb-4">
          <ul className="flex gap-1 lg:flex-col">
            {ADMIN_MENU.map((m) => (
              <li key={m.label} className="shrink-0">
                {m.href ? (
                  <Link
                    href={m.href}
                    aria-current={isActive(m.href) ? "page" : undefined}
                    className={`block whitespace-nowrap rounded-ui px-2.5 py-1.5 text-[13px] transition-colors ${
                      isActive(m.href) ? "bg-gold-tint font-semibold text-gold-deeper" : "text-ink hover:bg-sand"
                    }`}
                  >
                    {m.label}
                  </Link>
                ) : (
                  <span className="flex items-center justify-between gap-2 whitespace-nowrap rounded-ui px-2.5 py-1.5 text-[13px] text-muted/80" aria-disabled="true">
                    {m.label}
                    <span className="hidden text-[10px] uppercase tracking-wide lg:inline">Sắp có</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-3 py-2 sm:px-5">
          <h1 className="font-serif text-xl text-ink">{title}</h1>
          <div className="flex items-center gap-3 text-[13px]">
            <Link href="/" className="text-gold-deep hover:underline">Xem cửa hàng</Link>
            <span className="hidden text-muted sm:inline">{user?.email}</span>
            <LogoutLink size="sm" />
          </div>
        </header>
        <main className="p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}

function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const { user } = useAuth();
  return (
    <ShopLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-ink sm:text-3xl">{title}</h1>
            {user?.email && <p className="mt-1 text-sm text-muted">{user.email}</p>}
          </div>
          <LogoutLink />
        </div>
        {children}
      </div>
    </ShopLayout>
  );
}

export function DashboardLayout({
  title,
  children,
  variant = "account",
}: {
  title: string;
  children: ReactNode;
  variant?: "account" | "admin";
}) {
  return variant === "admin" ? (
    <AdminShell title={title}>{children}</AdminShell>
  ) : (
    <AccountShell title={title}>{children}</AccountShell>
  );
}
