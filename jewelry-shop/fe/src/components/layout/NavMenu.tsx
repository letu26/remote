"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useId, useRef, useState } from "react";
import { ChevronIcon } from "@/components/ui/Icons";
import { SmartLink } from "@/components/ui/SmartLink";
import { isExternalLink, type NavNode } from "@/utils/cms";

type IsActive = (href: string) => boolean;
const NEVER_ACTIVE: IsActive = () => false;

/** Mục đang mở: cùng đường dẫn và khớp mọi tham số truy vấn của liên kết (ví dụ ?sale=1). */
function matchesUrl(href: string, pathname: string | null, params: URLSearchParams | null): boolean {
  // Liên kết neo (ví dụ "/#bo-suu-tap") trỏ tới một phần của trang chứ không phải một trang riêng: không tô.
  if (!pathname || isExternalLink(href) || href.includes("#")) return false;
  const target = new URL(href, "http://local");
  const samePath = target.pathname === "/" ? pathname === "/" : pathname === target.pathname || pathname.startsWith(`${target.pathname}/`);
  if (!samePath) return false;
  const onSale = params?.get("sale") === "1" || params?.get("onSale") === "true";
  const current = (k: string) => (k === "onSale" ? (onSale ? "true" : null) : (params?.get(k) ?? null));
  const wanted = [...target.searchParams.entries()];
  if (wanted.length > 0) return wanted.every(([k, v]) => current(k) === v);
  // "/products" (Trang sức) chỉ sáng khi xem tất cả; đang lọc theo danh mục, bộ sưu tập hay khuyến mại thì mục tương ứng sáng.
  return !(target.pathname === "/products" && (onSale || params?.get("category") || params?.get("collection")));
}

function useIsActive(): IsActive {
  const pathname = usePathname();
  const params = useSearchParams();
  return (href) => matchesUrl(href, pathname, params);
}

const linkClass = (sale: boolean, active: boolean) =>
  `rounded-full px-1 text-sm tracking-wide transition-colors ${
    active ? (sale ? "font-semibold text-sale" : "font-semibold text-gold-deep") : "text-ink hover:text-gold-deep"
  }`;

function DesktopItem({ item, isActive }: { item: NavNode; isActive: IsActive }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const skipFocusOpen = useRef(false);
  const sale = item.label === "Khuyến mại";
  const active = isActive(item.href) || !!item.children?.some((c) => isActive(c.href));

  if (!item.children?.length) {
    return (
      <li>
        <SmartLink href={item.href} className={linkClass(sale, active)} current={active}>{item.label}</SmartLink>
      </li>
    );
  }
  return (
    <li
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => {
        // Esc trả focus về nút: không mở lại menu.
        if (skipFocusOpen.current) {
          skipFocusOpen.current = false;
          return;
        }
        setOpen(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          skipFocusOpen.current = true;
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <div className="flex items-center gap-0.5">
        <SmartLink href={item.href} className={linkClass(sale, active)} current={active}>{item.label}</SmartLink>
        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={`Menu con của ${item.label}`}
          onClick={() => setOpen((v) => !v)}
          className="rounded-ui p-1 text-muted hover:text-gold-deep"
        >
          <ChevronIcon dir="down" width={14} height={14} />
        </button>
      </div>
      {open && (
        <ul id={id} className="absolute left-0 top-full z-50 min-w-48 rounded-ui border border-line bg-paper py-1 shadow-pop">
          {item.children.map((c) => (
            <li key={c.href + c.label}>
              <SmartLink href={c.href} className="block px-4 py-2 text-sm text-ink hover:bg-gold-tint hover:text-gold-deep">
                {c.label}
              </SmartLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Thanh điều hướng desktop: mục có con mở dropdown bằng hover, focus hoặc nút; Esc đóng. */
function DesktopList({ items, isActive }: { items: NavNode[]; isActive: IsActive }) {
  return (
    <ul className="mx-auto my-2 flex w-fit max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 rounded-full border border-line bg-paper/70 px-6 py-1.5 shadow-card backdrop-blur">
      {items.map((item, i) => (
        // Hai mục cùng đích (ví dụ "Trang sức" và "Bộ sưu tập" đều là /products): chỉ mục đầu được tô.
        <DesktopItem key={item.label + item.href} item={item} isActive={items.findIndex((x) => x.href === item.href) < i ? NEVER_ACTIVE : isActive} />
      ))}
    </ul>
  );
}

function ActiveDesktopList({ items }: { items: NavNode[] }) {
  return <DesktopList items={items} isActive={useIsActive()} />;
}

export function DesktopNav({ items }: { items: NavNode[] }) {
  // useSearchParams cần Suspense; trong lúc chờ vẫn hiện đủ menu, chỉ chưa tô mục đang mở.
  return (
    <Suspense fallback={<DesktopList items={items} isActive={NEVER_ACTIVE} />}>
      <ActiveDesktopList items={items} />
    </Suspense>
  );
}

function MobileItem({ item, onNavigate, isActive }: { item: NavNode; onNavigate: () => void; isActive: IsActive }) {
  const active = isActive(item.href);
  const [open, setOpen] = useState(false);
  const id = useId();
  const linkCls = `block flex-1 px-5 py-3.5 text-base hover:bg-gold-tint ${active ? "font-semibold text-gold-deep" : "text-ink"}`;
  if (!item.children?.length) {
    return (
      <li>
        <SmartLink href={item.href} onClick={onNavigate} className={linkCls} current={active}>{item.label}</SmartLink>
      </li>
    );
  }
  return (
    <li>
      <div className="flex items-stretch">
        <SmartLink href={item.href} onClick={onNavigate} className={linkCls} current={active}>{item.label}</SmartLink>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={`${open ? "Thu gọn" : "Mở rộng"} ${item.label}`}
          onClick={() => setOpen((v) => !v)}
          className="px-4 text-muted hover:bg-gold-tint"
        >
          <ChevronIcon dir={open ? "up" : "down"} width={18} height={18} />
        </button>
      </div>
      <ul id={id} hidden={!open} className="bg-sand/50">
        {item.children.map((c) => (
          <li key={c.href + c.label}>
            <SmartLink href={c.href} onClick={onNavigate} className="block py-3 pl-9 pr-5 text-sm text-ink hover:bg-gold-tint">
              {c.label}
            </SmartLink>
          </li>
        ))}
      </ul>
    </li>
  );
}

/** Menu trong drawer mobile: mục có con là accordion. */
function MobileList({ items, onNavigate, isActive }: { items: NavNode[]; onNavigate: () => void; isActive: IsActive }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <MobileItem key={item.label + item.href} item={item} onNavigate={onNavigate} isActive={isActive} />
      ))}
    </ul>
  );
}

function ActiveMobileList({ items, onNavigate }: { items: NavNode[]; onNavigate: () => void }) {
  return <MobileList items={items} onNavigate={onNavigate} isActive={useIsActive()} />;
}

export function MobileNav({ items, onNavigate }: { items: NavNode[]; onNavigate: () => void }) {
  return (
    <Suspense fallback={<MobileList items={items} onNavigate={onNavigate} isActive={NEVER_ACTIVE} />}>
      <ActiveMobileList items={items} onNavigate={onNavigate} />
    </Suspense>
  );
}
