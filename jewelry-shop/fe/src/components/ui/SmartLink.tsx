import Link from "next/link";
import type { ReactNode } from "react";
import { isExternalLink } from "@/utils/cms";

/** Liên kết nội bộ dùng `Link`; liên kết ngoài dùng `a` mở tab mới với `rel` an toàn. */
export function SmartLink({
  href,
  className,
  children,
  onClick,
  current,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  /** Trang đang mở: gắn aria-current="page". */
  current?: boolean;
}) {
  if (isExternalLink(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}
