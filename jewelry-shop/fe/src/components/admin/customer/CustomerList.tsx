"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { adminCustomerService } from "@/services/admin-customer.service";
import type { Paged } from "@/types/admin-catalog";
import type { AdminCustomer, CustomerRole, CustomerStatus } from "@/types/admin-customer";
import { formatVND } from "@/utils/format";
import { formatLocal } from "../dashboard/date-utils";
import { ROLE_LABEL, STATUS_LABEL } from "./customer-actions";

const PAGE_SIZE = 20;

export interface CustomerFilters {
  q: string;
  status: CustomerStatus | "";
  role: CustomerRole | "";
  page: number;
}
export function parseCustomerFilters(p: URLSearchParams): CustomerFilters {
  const st = p.get("status");
  const role = p.get("role");
  const page = Number(p.get("page"));
  return {
    q: p.get("q") ?? "",
    status: st === "active" || st === "locked" ? st : "",
    role: role === "user" || role === "admin" ? role : "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}
export function buildCustomerSearch(f: CustomerFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.status) p.set("status", f.status);
  if (f.role) p.set("role", f.role);
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function CustomerBadges({ c }: { c: Pick<AdminCustomer, "role" | "status"> }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {c.role === "admin" && <Badge tone="gold">{ROLE_LABEL.admin}</Badge>}
      <Badge tone={c.status === "locked" ? "sale" : "success"}>{STATUS_LABEL[c.status]}</Badge>
    </span>
  );
}

export function CustomerList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo(() => parseCustomerFilters(new URLSearchParams(params.toString())), [params]);
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounce(search.trim(), 500);
  const [data, setData] = useState<Paged<AdminCustomer> | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const apply = useCallback(
    (patch: Partial<CustomerFilters>) => {
      router.replace(`${pathname}${buildCustomerSearch({ ...filters, page: 1, ...patch })}`, { scroll: false });
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
    adminCustomerService
      .list({ page: filters.page, pageSize: PAGE_SIZE, q: filters.q || undefined, status: filters.status || undefined, role: filters.role || undefined })
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  const items = data?.items ?? [];
  const filtered = filters.q || filters.status || filters.role;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Tìm kiếm" name="customer-search" type="search" placeholder="Họ tên, số điện thoại, email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select label="Trạng thái" name="filter-status" value={filters.status} options={[{ value: "", label: "Tất cả" }, { value: "active", label: STATUS_LABEL.active }, { value: "locked", label: STATUS_LABEL.locked }]} onChange={(e) => apply({ status: e.target.value as CustomerFilters["status"] })} />
        <Select label="Vai trò" name="filter-role" value={filters.role} options={[{ value: "", label: "Tất cả" }, { value: "user", label: ROLE_LABEL.user }, { value: "admin", label: ROLE_LABEL.admin }]} onChange={(e) => apply({ role: e.target.value as CustomerFilters["role"] })} />
      </div>

      {loading && !data && (
        <div className="space-y-2" aria-busy="true" aria-label="Đang tải">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      )}
      {failed && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}
      {!failed && data && items.length === 0 && (
        <EmptyState title={filtered ? "Không tìm thấy người dùng phù hợp" : "Chưa có người dùng nào"} description={filtered ? "Thử đổi từ khóa hoặc bộ lọc." : "Tài khoản đăng ký sẽ hiện ở đây."} />
      )}

      {!failed && items.length > 0 && (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-paper shadow-card md:block">
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Danh sách người dùng</caption>
              <thead className="bg-sand text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Người dùng</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Liên hệ</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Số đơn</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Tổng chi tiêu</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Trạng thái</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((c) => (
                  <tr key={c.id} className={c.status === "locked" ? "bg-sand/50" : ""}>
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/customers/${c.id}`} className="font-medium text-ink hover:text-gold-deep hover:underline">{c.fullName}</Link>
                      <div className="text-xs text-muted">Đăng ký {formatLocal(c.createdAt)}</div>
                    </td>
                    <td className="px-3 py-2.5">{c.phone}<div className="text-xs text-muted">{c.email ?? "-"}</div></td>
                    <td className="px-3 py-2.5 text-right">{c.orderCount}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{formatVND(c.totalSpent)}</td>
                    <td className="px-3 py-2.5"><CustomerBadges c={c} /></td>
                    <td className="px-3 py-2.5 text-right"><ButtonLink href={`/admin/customers/${c.id}`} size="sm" variant="secondary" aria-label={`Xem ${c.fullName}`}>Xem</ButtonLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {items.map((c) => (
              <li key={c.id} className="rounded-lg border border-line bg-paper p-3 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/customers/${c.id}`} className="font-medium text-ink hover:underline">{c.fullName}</Link>
                  <CustomerBadges c={c} />
                </div>
                <p className="text-sm">{c.phone} · {c.email ?? "-"}</p>
                <p className="text-xs text-muted">{c.orderCount} đơn · {formatVND(c.totalSpent)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={(p) => apply({ page: p })} />}
    </section>
  );
}
