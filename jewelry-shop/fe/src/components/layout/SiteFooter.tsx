"use client";

import { SmartLink } from "@/components/ui/SmartLink";
import { COPYRIGHT_SUFFIX } from "@/constants/site";
import { useFooterMenu, useSiteInfo } from "@/store/site-store";
import { FALLBACK_FOOTER_MENU, socialLinks, telHref } from "@/utils/cms";
import { BrandLogo } from "./BrandLogo";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-serif text-xl text-ink">{title}</h2>
      {children}
    </div>
  );
}

const linkClass = "text-sm text-muted hover:text-gold-deep hover:underline";

export function SiteFooter() {
  const info = useSiteInfo();
  const cmsMenu = useFooterMenu();
  const menu = cmsMenu.length > 0 ? cmsMenu : FALLBACK_FOOTER_MENU;
  const socials = socialLinks(info);

  return (
    <footer className="mt-12 border-t border-line bg-sand">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <BrandLogo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">{info.slogan}</p>
          {info.footerText && <p className="max-w-xs whitespace-pre-line text-sm leading-relaxed text-muted">{info.footerText}</p>}
          {socials.length > 0 && (
            <ul aria-label="Mạng xã hội" className="flex flex-wrap gap-3">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gold-deep hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Column title="Liên hệ">
          <ul className="space-y-2 text-sm text-muted">
            <li>
              Hotline:{" "}
              <a href={telHref(info.hotline)} className="font-semibold text-ink hover:text-gold-deep">
                {info.hotline}
              </a>
            </li>
            <li>
              Email:{" "}
              <a href={`mailto:${info.email}`} className="hover:text-gold-deep hover:underline">
                {info.email}
              </a>
            </li>
            <li>Địa chỉ: {info.address}</li>
            <li>Giờ mở cửa: {info.openingHours}</li>
          </ul>
        </Column>
        <div className="sm:col-span-2">
          <Column title="Liên kết">
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {menu.map((l) => (
                <li key={l.label + l.href}>
                  <SmartLink href={l.href} className={linkClass}>
                    {l.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </Column>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {info.brandName}. {COPYRIGHT_SUFFIX}
      </div>
    </footer>
  );
}
