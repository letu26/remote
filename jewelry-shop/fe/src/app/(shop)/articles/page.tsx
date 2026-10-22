import { Suspense } from "react";
import { ArticlesView } from "@/components/content/ArticlesView";

export const metadata = { title: "Cẩm nang trang sức" };

export default function ArticlesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <p className="mb-1 text-xs font-medium uppercase tracking-[0.3em] text-gold-deep">Kiến thức &amp; cảm hứng</p>
      <h1 className="mb-2 font-serif text-4xl text-ink sm:text-5xl">Cẩm nang trang sức</h1>
      <p className="mb-8 max-w-xl text-sm text-muted">Mẹo chọn, bảo quản và phối trang sức đá quý từ các chuyên gia.</p>
      <Suspense fallback={null}>
        <ArticlesView />
      </Suspense>
    </div>
  );
}
