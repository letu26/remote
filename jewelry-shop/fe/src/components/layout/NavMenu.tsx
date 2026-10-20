"use client";

import { useId, useRef, useState } from "react";
import { ChevronIcon } from "@/components/ui/Icons";
import { SmartLink } from "@/components/ui/SmartLink";
import type { NavNode } from "@/utils/cms";

const linkClass = (sale: boolean) =>
  `text-sm tracking-wide hover:text-gold-deep ${sale ? "font-semibold text-sale" : "text-ink"}`;

function DesktopItem({ item }: { item: NavNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const skipFocusOpen = useRef(false);
  const sale = item.label === "Khuyến mại";

  if (!item.children?.length) {
    return (
      <li>
        <SmartLink href={item.href} className={linkClass(sale)}>{item.label}</SmartLink>
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
        <SmartLink href={item.href} className={linkClass(sale)}>{item.label}</SmartLink>
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
export function DesktopNav({ items }: { items: NavNode[] }) {
  return (
    <ul className="mx-auto my-2 flex w-fit max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 rounded-full border border-line bg-paper/70 px-6 py-1.5 shadow-card backdrop-blur">
      {items.map((item) => (
        <DesktopItem key={item.label + item.href} item={item} />
      ))}
    </ul>
  );
}

function MobileItem({ item, onNavigate }: { item: NavNode; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const linkCls = "block flex-1 px-5 py-3.5 text-base text-ink hover:bg-gold-tint";
  if (!item.children?.length) {
    return (
      <li>
        <SmartLink href={item.href} onClick={onNavigate} className={linkCls}>{item.label}</SmartLink>
      </li>
    );
  }
  return (
    <li>
      <div className="flex items-stretch">
        <SmartLink href={item.href} onClick={onNavigate} className={linkCls}>{item.label}</SmartLink>
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
export function MobileNav({ items, onNavigate }: { items: NavNode[]; onNavigate: () => void }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <MobileItem key={item.label + item.href} item={item} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}
