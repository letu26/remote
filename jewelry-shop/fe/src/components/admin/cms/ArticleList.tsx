"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { adminArticleService } from "@/services/admin-cms.service";
import type { Paged } from "@/types/admin-catalog";
import type { AdminArticleListItem } from "@/types/admin-cms";
import { confirmAction } from "@/utils/confirm";
import { notify } from "@/utils/notify";
import { adminErrorMessage } from "../admin-errors";
import { formatDateTime } from "../order/order-meta";

const PAGE_SIZE = 20;

export interface ArticleFilters {
  q: string;
  published: "" | "true" | "false";
  page: number;
}
export function parseArticleFilters(p: URLSearchParams): ArticleFilters {
  const pub = p.get("published") ?? "";
  const page = Number(p.get("page"));
  return {
    q: p.get("q") ?? "",
    published: pub === "true" || pub === "false" ? pub : "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}
export function buildArticleSearch(f: ArticleFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.published) p.set("published", f.published);
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function ArticleList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo(() => parseArticleFilters(new URLSearchParams(params.toString())), [params]);
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounce(search.trim(), 500);
  const [data, setData] = useState<Paged<AdminArticleListItem> | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);

  const apply = useCallback(
    (patch: Partial<ArticleFilters>) => {
      router.replace(`${pathname}${buildArticleSearch({ ...filters, page: 1, ...patch })}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  useEffect(() => {
    if (debounced !== filters.q) apply({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi giá trị debounce đổi
  }, [debounced]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ ô nhập với URL
    setSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ trạng thái tải với bộ lọc
    setLoading(true);
    setFailed(false);
    adminArticleService
      .list({ page: filters.page, pageSize: PAGE_SIZE, q: filters.q || undefined, published: filters.published ? filters.published === "true" : undefined })
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  const remove = async (a: AdminArticleListItem) => {
    const ok = await confirmAction({ title: "Xóa bài viết", text: `Xóa bài "${a.title}"? Thao tác này không thể hoàn tác.`, confirmText: "Xóa", tone: "danger" });
    if (!ok) return;
    setBusyId(a.id);
    try {
      await adminArticleService.remove(a.id);
      notify("success", "Đã xóa bài viết");
      setReloadKey((k) => k + 1);
    } catch (e) {
      notify("error", adminErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const items = data?.items ?? [];
  const filtered = filters.q || filters.published;
  const status = (a: AdminArticleListItem) => <Badge tone={a.isPublished ? "success" : "neutral"}>{a.isPublished ? "Đã đăng" : "Bản nháp"}</Badge>;
  const actions = (a: AdminArticleListItem) => (
    <div className="flex justify-end gap-1.5">
      <ButtonLink href={`/admin/articles/${a.id}`} size="sm" variant="secondary" aria-label={`Sửa ${a.title}`}>Sửa</ButtonLink>
      <Button size="sm" variant="ghost" className="text-danger! hover:bg-danger/10!" loading={busyId === a.id} onClick={() => remove(a)} aria-label={`Xóa ${a.title}`}>
        Xóa
      </Button>
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field label="Tìm kiếm" name="article-search" type="search" placeholder="Tiêu đề hoặc tóm tắt" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="min-w-40">
          <Select
            label="Trạng thái"
            name="filter-published"
            value={filters.published}
            options={[
              { value: "", label: "Tất cả" },
              { value: "true", label: "Đã đăng" },
              { value: "false", label: "Bản nháp" },
            ]}
            onChange={(e) => apply({ published: e.target.value as ArticleFilters["published"] })}
          />
        </div>
        <ButtonLink href="/admin/articles/new">Thêm bài viết</ButtonLink>
      </div>

      {loading && !data && (
        <div className="space-y-2" aria-busy="true" aria-label="Đang tải">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {failed && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}
      {!failed && data && items.length === 0 && (
        <EmptyState title={filtered ? "Không tìm thấy bài viết phù hợp" : "Chưa có bài viết nào"} description={filtered ? "Thử đổi từ khóa hoặc bộ lọc." : "Nhấn \"Thêm bài viết\" để viết bài đầu tiên."} />
      )}

      {!failed && items.length > 0 && (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-paper shadow-card md:block">
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Danh sách bài viết</caption>
              <thead className="bg-sand text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Tiêu đề</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Trạng thái</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Cập nhật</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/articles/${a.id}`} className="font-medium text-ink hover:text-gold-deep hover:underline">{a.title}</Link>
                      <div className="text-xs text-muted">{a.slug}</div>
                    </td>
                    <td className="px-3 py-2.5">{status(a)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{formatDateTime(a.updatedAt)}</td>
                    <td className="px-3 py-2.5">{actions(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {items.map((a) => (
              <li key={a.id} className="rounded-lg border border-line bg-paper p-3 shadow-card">
                <Link href={`/admin/articles/${a.id}`} className="font-medium text-ink hover:underline">{a.title}</Link>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">{status(a)} {formatDateTime(a.updatedAt)}</div>
                <div className="mt-2 border-t border-line pt-2">{actions(a)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={(p) => apply({ page: p })} />}
    </section>
  );
}
