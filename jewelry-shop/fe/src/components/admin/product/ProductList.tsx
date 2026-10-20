"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { adminCategoryService } from "@/services/admin-catalog.service";
import { adminProductService } from "@/services/admin-product.service";
import type { AdminCategory, AdminProductListItem, Paged } from "@/types/admin-catalog";
import { formatVND } from "@/utils/format";
import { confirmAction } from "@/utils/confirm";
import { notify } from "@/utils/notify";
import { adminErrorMessage, isInUse } from "../admin-errors";
import { arrangeCategoryTree } from "../catalog-configs";

const PAGE_SIZE = 20;

function Thumb({ url, name }: { url: string | null; name: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh Cloudinary bên ngoài, trang quản trị
    <img src={url} alt={name} className="h-12 w-12 shrink-0 rounded-ui border border-line object-cover" loading="lazy" />
  ) : (
    <span aria-label="Chưa có ảnh" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ui border border-dashed border-line-strong bg-sand text-[10px] text-muted">
      Chưa có ảnh
    </span>
  );
}

export function ProductList() {
  const [search, setSearch] = useState("");
  const q = useDebounce(search.trim(), 500);
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [data, setData] = useState<Paged<AdminProductListItem> | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    adminCategoryService.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ trạng thái tải với bộ lọc
    setLoading(true);
    setFailed(false);
    adminProductService
      .list({
        page,
        pageSize: PAGE_SIZE,
        q: q || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        isActive: active === "" ? undefined : active === "true",
      })
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, categoryId, active, page, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const toggleActive = async (item: AdminProductListItem) => {
    setBusyId(item.id);
    try {
      await adminProductService.setActive(item.id, !item.isActive);
      notify("success", item.isActive ? "Đã ẩn sản phẩm" : "Đã hiện sản phẩm");
      reload();
    } catch (e) {
      notify("error", adminErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const askDelete = async (item: AdminProductListItem) => {
    const ok = await confirmAction({
      title: "Xóa sản phẩm",
      text: `Bạn có chắc muốn xóa sản phẩm "${item.name}"? Ảnh, biến thể, đá quý, đánh giá... của sản phẩm cũng bị xóa và không thể hoàn tác.`,
      confirmText: "Xóa",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(item.id);
    try {
      await adminProductService.remove(item.id);
      notify("success", "Đã xóa sản phẩm");
      if (data && data.items.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (e) {
      notify("error", adminErrorMessage(e));
      if (isInUse(e) && item.isActive) {
        const hide = await confirmAction({
          title: "Không thể xóa sản phẩm",
          text: "Bạn có thể ẩn sản phẩm này thay vì xóa.",
          confirmText: "Ẩn sản phẩm này",
        });
        if (hide) await toggleActive(item);
      }
    } finally {
      setBusyId(null);
    }
  };

  const categoryOptions = [
    { value: "", label: "Tất cả danh mục" },
    ...arrangeCategoryTree(categories).map((c) => ({ value: String(c.id), label: `${"— ".repeat(c.depth ?? 0)}${c.name}` })),
  ];
  const items = data?.items ?? [];
  const filtered = q !== "" || categoryId !== "" || active !== "";

  const actions = (p: AdminProductListItem) => (
    <div className="flex flex-wrap justify-end gap-1.5">
      <ButtonLink href={`/admin/products/${p.id}`} size="sm" variant="secondary" aria-label={`Sửa ${p.name}`}>Sửa</ButtonLink>
      <Button size="sm" variant="ghost" loading={busyId === p.id} onClick={() => toggleActive(p)} aria-label={`${p.isActive ? "Ẩn" : "Hiện"} ${p.name}`}>
        {p.isActive ? "Ẩn" : "Hiện"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-danger! hover:bg-danger/10!"
        onClick={() => askDelete(p)}
        aria-label={`Xóa ${p.name}`}
      >
        Xóa
      </Button>
    </div>
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field label="Tìm kiếm" name="product-search" type="search" placeholder="Tên hoặc mã sản phẩm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="min-w-44">
          <Select label="Danh mục" name="filter-category" value={categoryId} options={categoryOptions} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} />
        </div>
        <div className="min-w-36">
          <Select
            label="Trạng thái"
            name="filter-active"
            value={active}
            options={[
              { value: "", label: "Tất cả" },
              { value: "true", label: "Đang hiện" },
              { value: "false", label: "Đã ẩn" },
            ]}
            onChange={(e) => { setActive(e.target.value); setPage(1); }}
          />
        </div>
        <ButtonLink href="/admin/products/new">Thêm sản phẩm</ButtonLink>
      </div>

      {loading && !data && (
        <div className="space-y-2" aria-busy="true" aria-label="Đang tải">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}
      {failed && <ErrorState onRetry={reload} />}
      {!failed && data && items.length === 0 && (
        <EmptyState
          title={filtered ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm nào"}
          description={filtered ? "Thử đổi từ khóa hoặc bộ lọc." : "Nhấn \"Thêm sản phẩm\" để tạo sản phẩm đầu tiên."}
        />
      )}

      {!failed && items.length > 0 && (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-paper shadow-card md:block">
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Danh sách sản phẩm</caption>
              <thead className="bg-sand text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Ảnh</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Mã</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Tên</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Giá bán</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Tồn kho</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Trạng thái</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((p) => (
                  <tr key={p.id} className={p.isActive ? "" : "bg-sand/50"}>
                    <td className="px-3 py-2"><Thumb url={p.primaryImageUrl} name={p.name} /></td>
                    <td className="px-3 py-2 font-mono text-xs">{p.code}</td>
                    <td className="px-3 py-2">
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-gold-deep hover:underline">{p.name}</Link>
                      <div className="text-xs text-muted">{p.categoryName}</div>
                    </td>
                    <td className="px-3 py-2 text-right">{formatVND(p.price)}</td>
                    <td className={`px-3 py-2 text-right ${p.totalStock === 0 ? "font-semibold text-danger" : ""}`}>{p.totalStock}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Đang hiện" : "Đã ẩn"}</Badge>
                        {p.isFeatured && <Badge tone="gold">Nổi bật</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-2">{actions(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((p) => (
              <li key={p.id} className={`rounded-lg border border-line p-3 shadow-card ${p.isActive ? "bg-paper" : "bg-sand/50"}`}>
                <div className="flex gap-3">
                  <Thumb url={p.primaryImageUrl} name={p.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${p.id}`} className="block font-medium text-ink hover:underline">{p.name}</Link>
                    <p className="text-xs text-muted"><span className="font-mono">{p.code}</span> · {p.categoryName}</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{formatVND(p.price)}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Đang hiện" : "Đã ẩn"}</Badge>
                  {p.isFeatured && <Badge tone="gold">Nổi bật</Badge>}
                  <span className={p.totalStock === 0 ? "font-semibold text-danger" : "text-muted"}>Tồn kho: {p.totalStock}</span>
                </div>
                <div className="mt-2 border-t border-line pt-2">{actions(p)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
    </section>
  );
}
