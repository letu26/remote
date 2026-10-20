import { Suspense } from "react";
import { ArticlesView } from "@/components/content/ArticlesView";

export const metadata = { title: "Cẩm nang trang sức" };

export default function ArticlesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <h1 className="mb-6 font-serif text-3xl text-ink sm:text-4xl">Cẩm nang trang sức</h1>
      <Suspense fallback={null}>
        <ArticlesView />
      </Suspense>
    </div>
  );
}
