import Link from "next/link";
import { ProductArt } from "@/components/product/ProductArt";
import { ButtonLink } from "@/components/ui/Button";
import { RefreshIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";
import { POLICIES } from "@/constants/site";
import { BRAND_NAME, BRAND_TAGLINE } from "@/constants";
import { HomeActions } from "./HomeActions";

export function SectionHeading({
  title,
  kicker,
  href,
  linkLabel = "Xem tất cả",
}: {
  title: string;
  kicker?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className="mb-1 text-xs font-medium uppercase tracking-[0.3em] text-gold-deep">{kicker}</p>}
        <h2 className="font-serif text-3xl text-ink sm:text-4xl">{title}</h2>
        <div className="mt-3 flex items-center gap-1.5" aria-hidden>
          <span className="h-0.5 w-10 rounded-full bg-gold-deep" />
          <span className="h-0.5 w-3 rounded-full bg-gold/60" />
          <span className="h-0.5 w-1 rounded-full bg-gold/40" />
        </div>
      </div>
      {href && (
        <Link href={href} className="shrink-0 rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-gold-deep transition-colors hover:border-gold-deep hover:bg-gold-tint">
          {linkLabel} &rarr;
        </Link>
      )}
    </div>
  );
}

export function Section({
  id,
  children,
  tinted = false,
}: {
  id?: string;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-32 py-10 sm:py-14 ${tinted ? "bg-sand/60" : ""}`}>
      <div className="mx-auto max-w-7xl px-4">{children}</div>
    </section>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-[radial-gradient(ellipse_at_top_right,#f7edd2_0%,#fbf8f1_55%,#eaf6f2_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:py-16 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <p className="mb-4 text-xs uppercase tracking-[0.4em] text-gold-deep">{BRAND_TAGLINE}</p>
          <h1 className="font-serif text-4xl leading-[1.1] text-ink sm:text-6xl">
            Vẻ đẹp tinh khôi, <span className="text-gold-deep">lấp lánh</span> cùng {BRAND_NAME}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted lg:mx-0 sm:text-lg">
            Mỗi viên đá là một câu chuyện, mỗi món trang sức là một dấu ấn riêng. Khám phá bộ sưu tập kim cương,
            ruby, sapphire và ngọc trai chế tác thủ công.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <ButtonLink href="/products" size="lg">
              Khám phá bộ sưu tập
            </ButtonLink>
            <HomeActions />
          </div>
        </div>
        <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-4">
          <div className="aspect-[4/5] -rotate-2 overflow-hidden rounded-2xl border border-white/70 shadow-pop">
            <ProductArt art={{ kind: "ring", gem: "kim-cuong" }} metal="vang-trang" label="Nhẫn kim cương minh họa" />
          </div>
          <div className="mt-10 aspect-[4/5] rotate-2 overflow-hidden rounded-2xl border border-white/70 shadow-pop">
            <ProductArt art={{ kind: "necklace", gem: "ngoc-trai" }} metal="vang" variant={1} label="Dây chuyền ngọc trai minh họa" />
          </div>
        </div>
      </div>
    </section>
  );
}

const POLICY_ICON = { "bao-hanh": ShieldIcon, "doi-tra": RefreshIcon, "giao-hang": TruckIcon } as const;

export function PolicyBlock() {
  return (
    <Section id="chinh-sach" tinted>
      <SectionHeading title="Cam kết của chúng tôi" kicker="An tâm mua sắm" />
      <ul className="grid gap-5 md:grid-cols-3">
        {POLICIES.map((p) => {
          const Icon = POLICY_ICON[p.key];
          return (
            <li key={p.key} className="rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-tint text-gold-deep">
                <Icon width={24} height={24} />
              </span>
              <h3 className="font-serif text-2xl text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.detail}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
