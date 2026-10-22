"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES } from "@/constants";
import { ShopLayout } from "@/layouts/ShopLayout";
import { useAuth } from "@/store/auth-context";

// Mục có `href` là trang đã làm; nhóm chỉ để chia menu cho dễ tìm (hiện tiêu đề nhóm ở màn hình rộng).
const ADMIN_MENU: { label: string; href: string; group?: string }[] = [
  { label: "Tổng quan", href: "/admin" },
  { label: "Đơn hàng", href: "/admin/orders", group: "Bán hàng" },
  { label: "Người dùng", href: "/admin/customers" },
  { label: "Khuyến mại", href: "/admin/promotions" },
  { label: "Vận chuyển", href: "/admin/shipping-methods" },
  { label: "Đánh giá", href: "/admin/reviews" },
  { label: "Sản phẩm", href: "/admin/products", group: "Kho hàng" },
  { label: "Danh mục", href: "/admin/categories" },
  { label: "Chất liệu", href: "/admin/materials" },
  { label: "Loại đá", href: "/admin/gemstones" },
  { label: "Bộ sưu tập", href: "/admin/collections" },
  { label: "Bài viết", href: "/admin/articles", group: "Nội dung" },
  { label: "Trang nội dung", href: "/admin/pages" },
  { label: "Hỏi đáp", href: "/admin/faqs" },
  { label: "Banner", href: "/admin/banners" },
  { label: "Menu", href: "/admin/menus" },
  { label: "Cài đặt", href: "/admin/settings", group: "Hệ thống" },
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
      <aside className="border-b border-line bg-paper lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-3 py-2.5 lg:block lg:py-4">
          <BrandLogo className="[&>span]:text-lg [&>span]:tracking-[0.1em]" />
          <span className="rounded-full bg-gold-tint px-2 py-0.5 text-[11px] font-semibold text-gold-deeper lg:mt-2 lg:inline-block">
            Quản trị
          </span>
        </div>
        <nav aria-label="Menu quản trị" className="overflow-x-auto px-2 pb-2 lg:px-2 lg:pb-4">
          <ul className="flex gap-1 lg:flex-col">
            {ADMIN_MENU.map((m) => (
              <li key={m.label} className="shrink-0">
                {m.group && (
                  <p className="mb-1 mt-4 hidden px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted lg:block">
                    {m.group}
                  </p>
                )}
                <Link
                  href={m.href}
                  aria-current={isActive(m.href) ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-ui px-2.5 py-1.5 text-[13px] transition-colors ${
                    isActive(m.href) ? "bg-gold-tint font-semibold text-gold-deeper" : "text-ink hover:bg-sand"
                  }`}
                >
                  {m.label}
                </Link>
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

const ACCOUNT_TABS = [
  { label: "Tài khoản", href: ROUTES.user },
  { label: "Đơn hàng", href: ROUTES.orders },
  { label: "Đánh giá", href: ROUTES.reviews },
  { label: "Sổ địa chỉ", href: ROUTES.addresses },
];

function AccountShell({ title, children, bare = false }: { title: string; children: ReactNode; bare?: boolean }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isActiveTab = (href: string) => (href === ROUTES.user ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  // Trang chỉ hiện tiêu đề và nội dung (ví dụ Bộ sưu tập): không email, nút hay thanh tab.
  if (bare) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-6 font-serif text-3xl text-ink sm:text-4xl">{title}</h1>
          {children}
        </div>
      </ShopLayout>
    );
  }
  return (
    <ShopLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-ink sm:text-3xl">{title}</h1>
            {user?.email && <p className="mt-1 text-sm text-muted">{user.email}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pathname === ROUTES.user && (
              <>
                <ButtonLink href={ROUTES.changePassword} variant="secondary">
                  Đổi mật khẩu
                </ButtonLink>
                <LogoutLink />
              </>
            )}
          </div>
        </div>
        <nav aria-label="Khu vực tài khoản" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
          {ACCOUNT_TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActiveTab(t.href) ? "page" : undefined}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
                isActiveTab(t.href)
                  ? "border-gold-deep font-semibold text-gold-deep"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </ShopLayout>
  );
}

export function DashboardLayout({
  title,
  children,
  variant = "account",
  bare = false,
}: {
  title: string;
  children: ReactNode;
  variant?: "account" | "admin";
  /** Chỉ cho trang tài khoản: ẩn email, nút và thanh tab, chỉ giữ tiêu đề và nội dung. */
  bare?: boolean;
}) {
  return variant === "admin" ? (
    <AdminShell title={title}>{children}</AdminShell>
  ) : (
    <AccountShell title={title} bare={bare}>{children}</AccountShell>
  );
}
