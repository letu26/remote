"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { inputClass } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebounce } from "@/hooks/useDebounce";
import { cmsService } from "@/services/cms.service";
import { ArticleCard } from "./ArticleCard";

const PAGE_SIZE = 9;

/** Danh sách bài viết: tìm kiếm debounce 500ms, phân trang; `q` và `page` nằm trên URL. */
export function ArticlesView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [text, setText] = useState(q);
  const debounced = useDebounce(text.trim(), 500);

  // Gõ xong (đủ 500ms) mới cập nhật URL; đổi từ khóa thì về trang 1.
  useEffect(() => {
    if (debounced === q) return;
    const next = new URLSearchParams();
    if (debounced) next.set("q", debounced);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // chỉ phản ứng với giá trị đã debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, loading, failed, reload } = useAsyncData(`articles-${q}-${page}`, (signal) =>
    cmsService.articles({ page, pageSize: PAGE_SIZE, q: q || undefined }, signal),
  );

  const goPage = (p: number) => {
    const next = new URLSearchParams(params.toString());
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <label htmlFor="article-search" className="sr-only">Tìm bài viết</label>
        <input
          id="article-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tìm bài viết..."
          className={inputClass()}
        />
      </div>

      {failed ? (
        <ErrorState onRetry={reload} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Đang tải">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={q ? "Không tìm thấy bài viết phù hợp" : "Chưa có bài viết nào"}
          description={q ? "Hãy thử từ khóa khác." : "Cẩm nang trang sức sẽ sớm được cập nhật."}
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((a) => (
              <li key={a.id}><ArticleCard article={a} /></li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={goPage} />
        </>
      )}
    </div>
  );
}
