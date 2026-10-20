import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleCard } from "@/components/content/ArticleCard";
import { PublishedDate } from "@/components/content/PublishedDate";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cmsService } from "@/services/cms.service";
import type { ArticleDetail } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const a = await cmsService.article(slug);
    return a ? { title: a.title, description: a.summary ?? undefined } : { title: "Không tìm thấy bài viết" };
  } catch {
    return { title: "Bài viết" };
  }
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-10 h-96 max-w-3xl" />}>
      <ArticleContent params={params} />
    </Suspense>
  );
}

async function ArticleContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: ArticleDetail | null;
  try {
    article = await cmsService.article(slug);
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState title="Không tải được bài viết" description="Vui lòng tải lại trang sau ít phút." />
      </div>
    );
  }
  if (!article) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">{article.title}</h1>
      <PublishedDate iso={article.publishedAt} className="mt-2 block text-sm text-muted" />
      {article.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh do admin tải lên
        <img src={article.thumbnailUrl} alt={article.title} className="mt-6 aspect-[16/9] w-full rounded-lg border border-line object-cover" />
      )}
      <div className="mt-6">
        <MarkdownContent>{article.content}</MarkdownContent>
      </div>
      {article.related.length > 0 && (
        <section aria-labelledby="bai-lien-quan" className="mt-12">
          <h2 id="bai-lien-quan" className="mb-4 font-serif text-2xl text-ink">Bài viết liên quan</h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {article.related.map((a) => <li key={a.id}><ArticleCard article={a} /></li>)}
          </ul>
        </section>
      )}
    </article>
  );
}
