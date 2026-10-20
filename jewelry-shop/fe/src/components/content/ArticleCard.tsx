import Link from "next/link";
import type { ArticleItem } from "@/types/cms";
import { formatDate } from "@/utils/format";

/** Thẻ bài viết: ảnh đại diện (nếu có), tiêu đề, tóm tắt, ngày đăng. */
export function ArticleCard({ article }: { article: ArticleItem }) {
  const href = `/articles/${article.slug}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-paper shadow-card transition-shadow hover:shadow-pop">
      <Link href={href} tabIndex={-1} aria-hidden className="block aspect-[16/10] overflow-hidden bg-sand">
        {article.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh do admin tải lên
          <img src={article.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-4xl text-gold" aria-hidden>
            ◇
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <time dateTime={article.publishedAt} className="text-xs text-muted">{formatDate(article.publishedAt)}</time>
        <h3 className="line-clamp-2 font-serif text-lg leading-snug text-ink">
          <Link href={href} className="hover:text-gold-deep">{article.title}</Link>
        </h3>
        {article.summary && <p className="line-clamp-3 text-sm text-muted">{article.summary}</p>}
      </div>
    </article>
  );
}
