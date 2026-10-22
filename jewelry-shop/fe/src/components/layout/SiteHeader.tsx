"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartIcon, HeartIcon, MenuIcon, UserIcon } from "@/components/ui/Icons";
import { Drawer } from "@/components/ui/Drawer";
import { useHeaderMenu, useSiteInfo } from "@/store/site-store";
import { FALLBACK_HEADER_LEAD, FALLBACK_HEADER_TAIL, telHref, type NavNode } from "@/utils/cms";
import { DesktopNav, MobileNav } from "./NavMenu";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getCategories } from "@/services/product.service";
import { ROLE_HOME, ROUTES } from "@/constants";
import { useAuth } from "@/store/auth-context";
import { useCartCount } from "@/store/cart-store";
import { useGivenName } from "@/store/profile-store";
import { BrandLogo } from "./BrandLogo";
import { HeaderSearch } from "./HeaderSearch";

const ACCOUNT_LINKS = [
  { label: "Giỏ hàng", href: ROUTES.cart },
  { label: "Đơn hàng của tôi", href: ROUTES.orders },
  { label: "Đánh giá của tôi", href: ROUTES.reviews },
  { label: "Yêu thích", href: ROUTES.wishlist },
  { label: "Sổ địa chỉ", href: ROUTES.addresses },
];

function AccountLink({ onNavigate }: { onNavigate?: () => void }) {
  const { status, role } = useAuth();
  const authed = status === "authenticated" && role;
  const href = authed ? ROLE_HOME[role] : ROUTES.login;
  const name = useGivenName();
  const fallback = role === "admin" ? "Quản trị" : "Tài khoản";
  const label = authed ? (name ? `Chào ${name}` : fallback) : "Đăng nhập";
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-1.5 rounded-ui px-2 py-1.5 text-sm text-ink hover:bg-sand hover:text-gold-deep"
    >
      <UserIcon />
      <span className="hidden max-w-32 truncate sm:inline">{status === "loading" ? "Tài khoản" : label}</span>
    </Link>
  );
}

/**
 * Menu đầu trang: ưu tiên menu từ CMS. API lỗi/rỗng thì dùng dự phòng:
 * mục tĩnh + danh mục gốc từ API (thiếu danh mục thì chỉ còn các mục tĩnh).
 */
function useNavItems(): NavNode[] {
  const cms = useHeaderMenu();
  const { data } = useAsyncData("nav-categories", () => getCategories());
  return useMemo(
    () =>
      cms.length > 0
        ? cms
        : [
            ...FALLBACK_HEADER_LEAD,
            ...(data ?? []).map((c) => ({ label: c.name, href: `/products?category=${c.slug}` })),
            ...FALLBACK_HEADER_TAIL,
          ],
    [cms, data],
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const navItems = useNavItems();
  const info = useSiteInfo();
  const cartCount = useCartCount();
  const { status, role } = useAuth();

  return (
    <>
      <div className="hidden bg-gold-deep text-[11px] text-white sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1">
          <span>Miễn phí đổi size trong 30 ngày - Bảo hành trọn đời</span>
          <span>
            Hotline: <a href={telHref(info.hotline)} className="font-semibold hover:underline">{info.hotline}</a>
          </span>
        </div>
      </div>
    <header className="sticky top-0 z-40 border-b border-line/70 bg-page/85 backdrop-blur-md">
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-full h-2 bg-gradient-to-b from-ink/10 to-transparent transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"}`}
      />
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2 py-2 md:gap-5">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu"
            aria-haspopup="dialog"
            className="rounded-ui p-2.5 text-ink transition-colors hover:bg-sand lg:hidden"
          >
            <MenuIcon />
          </button>
          <BrandLogo className="mr-auto md:mr-0" />
          <HeaderSearch className="hidden max-w-xl flex-1 md:block" />
          <div className="flex items-center gap-1 md:ml-auto">
            <AccountLink />
            {status === "authenticated" && (
              <Link
                href={ROUTES.wishlist}
                aria-label="Yêu thích"
                className="hidden rounded-ui p-2 text-ink hover:bg-sand hover:text-gold-deep sm:block"
              >
                <HeartIcon />
              </Link>
            )}
            <Link
              href={ROUTES.cart}
              aria-label={cartCount ? `Giỏ hàng, ${cartCount} sản phẩm` : "Giỏ hàng"}
              className="relative rounded-ui p-2 text-ink hover:bg-sand hover:text-gold-deep"
            >
              <CartIcon />
              {cartCount ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sale px-1 text-[11px] font-semibold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
        <HeaderSearch className="pb-3 md:hidden" />
      </div>

      <nav aria-label="Danh mục chính" className="hidden lg:block">
        <DesktopNav items={navItems} />
      </nav>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Danh mục" side="left">
        <nav aria-label="Menu di động">
          <MobileNav items={navItems} onNavigate={() => setMenuOpen(false)} />
        </nav>
        <div className="space-y-3 border-t border-line p-5 text-sm">
          {status === "authenticated" && role ? (
            <div className="flex flex-col gap-3">
              <Link href={ROLE_HOME[role]} onClick={() => setMenuOpen(false)} className="font-semibold text-gold-deep">
                {role === "admin" ? "Vào khu vực quản trị" : "Tài khoản của tôi"}
              </Link>
              {ACCOUNT_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-ink hover:text-gold-deep">
                  {l.label}
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex gap-4">
              <Link href={ROUTES.login} onClick={() => setMenuOpen(false)} className="font-semibold text-gold-deep">
                Đăng nhập
              </Link>
              <Link href={ROUTES.register} onClick={() => setMenuOpen(false)} className="text-ink">
                Đăng ký
              </Link>
            </div>
          )}
          <p className="text-muted">Hotline: {info.hotline}</p>
        </div>
      </Drawer>
    </header>
    </>
  );
}
