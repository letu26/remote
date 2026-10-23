"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { ChevronIcon } from "@/components/ui/Icons";

interface NavItem {
  label: string;
  href: string;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const OVERVIEW: NavItem = { label: "Tổng quan", href: "/admin" };
const SETTINGS: NavItem = { label: "Cài đặt", href: "/admin/settings" };
const GROUPS: NavGroup[] = [
  {
    label: "Bán hàng",
    items: [
      { label: "Đơn hàng", href: "/admin/orders" },
      { label: "Người dùng", href: "/admin/customers" },
      { label: "Khuyến mại", href: "/admin/promotions" },
      { label: "Vận chuyển", href: "/admin/shipping-methods" },
      { label: "Đánh giá", href: "/admin/reviews" },
    ],
  },
  {
    label: "Kho hàng",
    items: [
      { label: "Sản phẩm", href: "/admin/products" },
      { label: "Danh mục", href: "/admin/categories" },
      { label: "Chất liệu", href: "/admin/materials" },
      { label: "Loại đá", href: "/admin/gemstones" },
      { label: "Bộ sưu tập", href: "/admin/collections" },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { label: "Bài viết", href: "/admin/articles" },
      { label: "Trang nội dung", href: "/admin/pages" },
      { label: "Hỏi đáp", href: "/admin/faqs" },
      { label: "Banner", href: "/admin/banners" },
      { label: "Menu", href: "/admin/menus" },
    ],
  },
];

/**
 * Menu bên của khu vực quản trị. Màn rộng: các mục con gập/mở được theo mục cha; nhóm chứa trang đang mở
 * tự mở khi vào trang. Màn hẹp: danh sách phẳng cuộn ngang, không gập.
 */
export function AdminNav() {
  const pathname = usePathname();
  const baseId = useId();
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const activeGroup = GROUPS.find((g) => g.items.some((i) => isActive(i.href)))?.label;
  // Lựa chọn gập/mở của người dùng ghi đè mặc định (mặc định: chỉ nhóm của trang đang mở thì mở).
  // Đổi sang nhóm khác thì bỏ ghi đè của nhóm đó để nó tự mở.
  const [override, setOverride] = useState<Record<string, boolean | undefined>>({});
  const [lastActive, setLastActive] = useState(activeGroup);
  if (lastActive !== activeGroup) {
    setLastActive(activeGroup);
    if (activeGroup) setOverride((cur) => ({ ...cur, [activeGroup]: undefined }));
  }
  const isOpen = (label: string) => override[label] ?? label === activeGroup;
  const toggle = (label: string) => setOverride((cur) => ({ ...cur, [label]: !isOpen(label) }));

  const itemClass = (active: boolean) =>
    `block whitespace-nowrap rounded-ui px-2.5 py-1.5 text-[13px] transition-[background-color,color,transform] duration-200 ${
      active
        ? "bg-gold-tint font-semibold text-gold-deeper"
        : "text-ink/80 hover:bg-sand hover:text-ink lg:hover:translate-x-0.5"
    }`;

  return (
    <nav aria-label="Menu quản trị" className="overflow-x-auto px-2 pb-2 lg:px-3 lg:pb-4">
      <ul className="flex gap-1 lg:flex-col lg:gap-0.5">
        <li className="shrink-0">
          <Link
            href={OVERVIEW.href}
            aria-current={isActive(OVERVIEW.href) ? "page" : undefined}
            className={`${itemClass(isActive(OVERVIEW.href))} lg:py-2 lg:text-sm ${isActive(OVERVIEW.href) ? "" : "lg:font-semibold lg:text-ink"}`}
          >
            {OVERVIEW.label}
          </Link>
        </li>
        {GROUPS.map((g) => {
          const expanded = isOpen(g.label);
          const panelId = `${baseId}-${g.label}`;
          return (
            <li key={g.label} className="max-lg:contents">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(g.label)}
                className="mt-2 hidden w-full items-center justify-between rounded-ui px-2.5 py-2 text-left text-[12px] font-bold uppercase tracking-[0.12em] text-ink transition-colors duration-200 hover:bg-sand lg:flex"
              >
                {g.label}
                <span aria-hidden className={`text-ink/60 transition-transform duration-300 ease-out ${expanded ? "rotate-180" : ""}`}>
                  <ChevronIcon dir="down" width={14} height={14} />
                </span>
              </button>
              {/* Gập/mở mượt bằng chiều cao lưới (0fr -> 1fr); mục con thụt vào so với mục cha, có đường kẻ dẫn bên trái. */}
              <div
                id={panelId}
                className={`max-lg:contents lg:grid lg:transition-[grid-template-rows,opacity] lg:duration-300 lg:ease-out motion-reduce:lg:transition-none ${
                  expanded ? "lg:grid-rows-[1fr] lg:opacity-100" : "lg:grid-rows-[0fr] lg:opacity-0"
                }`}
              >
                <ul
                  className={`max-lg:contents lg:ml-4 lg:min-h-0 lg:space-y-0.5 lg:overflow-hidden lg:border-l lg:border-line lg:pl-2 lg:transition-[visibility] lg:duration-300 ${
                    expanded ? "" : "lg:invisible"
                  }`}
                >
                  {g.items.map((i) => (
                    <li key={i.href} className="shrink-0">
                      <Link href={i.href} aria-current={isActive(i.href) ? "page" : undefined} className={itemClass(isActive(i.href))}>
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
        <li className="shrink-0">
          <Link
            href={SETTINGS.href}
            aria-current={isActive(SETTINGS.href) ? "page" : undefined}
            className={`${itemClass(isActive(SETTINGS.href))} lg:mt-2 lg:py-2 lg:text-sm ${isActive(SETTINGS.href) ? "" : "lg:font-semibold lg:text-ink"}`}
          >
            {SETTINGS.label}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
