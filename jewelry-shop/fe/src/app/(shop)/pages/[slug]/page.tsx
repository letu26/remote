import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cmsService } from "@/services/cms.service";
import type { PageDetail } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await cmsService.page(slug);
    return p ? { title: p.title } : { title: "Không tìm thấy trang" };
  } catch {
    return { title: "Trang nội dung" };
  }
}

export default function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-10 h-96 max-w-3xl" />}>
      <PageContent params={params} />
    </Suspense>
  );
}

async function PageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let page: PageDetail | null;
  try {
    page = await cmsService.page(slug);
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState title="Không tải được trang" description="Vui lòng tải lại trang sau ít phút." />
      </div>
    );
  }
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="mb-6 font-serif text-3xl text-ink sm:text-4xl">{page.title}</h1>
      <MarkdownContent>{page.content}</MarkdownContent>
    </article>
  );
}
