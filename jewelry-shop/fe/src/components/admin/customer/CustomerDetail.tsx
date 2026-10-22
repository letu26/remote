"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminCustomerService } from "@/services/admin-customer.service";
import { useAuth } from "@/store/auth-context";
import type { AdminCustomerDetail } from "@/types/admin-customer";
import { confirmAction } from "@/utils/confirm";
import { confirmWithNote } from "@/utils/confirm-note";
import { formatVND } from "@/utils/format";
import { notify } from "@/utils/notify";
import { adminErrorMessage } from "../admin-errors";
import { formatLocal } from "../dashboard/date-utils";
import { OrderStatusBadge, PaymentStatusBadge } from "../order/OrderBadges";
import { CustomerBadges } from "./CustomerList";
import { ROLE_LABEL, customerActions } from "./customer-actions";

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-ui border border-line bg-page p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-serif text-xl text-ink">{value}</p>
    </div>
  );
}

export function CustomerDetail({ customerId }: { customerId: number }) {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setCustomer(await adminCustomerService.get(customerId));
    } catch {
      setFailed(true);
    }
  }, [customerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu lần đầu
    void load();
  }, [load]);

  if (failed) return <ErrorState onRetry={load} />;
  if (!customer)
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  const actions = customerActions(customer, user?.id ?? null);

  const merge = (updated: Partial<AdminCustomerDetail>) => setCustomer((c) => (c ? { ...c, ...updated } : c));

  const lock = async () => {
    const reason = await confirmWithNote({
      title: "Khóa tài khoản",
      text: `Khóa tài khoản của ${customer.fullName}? Người này sẽ bị đăng xuất và không đăng nhập được cho tới khi mở khóa.`,
      confirmText: "Khóa tài khoản",
      tone: "danger",
      placeholder: "Lý do khóa (tùy chọn)",
    });
    if (reason === null) return;
    await run(() => adminCustomerService.setStatus(customer.id, "locked", reason || undefined), "Đã khóa tài khoản");
  };

  const unlock = async () => {
    const reason = await confirmWithNote({
      title: "Mở khóa tài khoản",
      text: `Mở khóa tài khoản của ${customer.fullName}?`,
      confirmText: "Mở khóa",
      placeholder: "Ghi chú (tùy chọn)",
    });
    if (reason === null) return;
    await run(() => adminCustomerService.setStatus(customer.id, "active", reason || undefined), "Đã mở khóa tài khoản");
  };

  const changeRole = async () => {
    const toAdmin = actions.nextRole === "admin";
    const ok = await confirmAction({
      title: toAdmin ? "Cấp quyền quản trị viên" : "Hạ quyền quản trị viên",
      text: toAdmin
        ? `${customer.fullName} sẽ có TOÀN QUYỀN quản trị cửa hàng (sản phẩm, đơn hàng, người dùng, cài đặt). Người này sẽ phải đăng nhập lại để quyền mới có hiệu lực. Chỉ cấp cho người bạn hoàn toàn tin tưởng.`
        : `${customer.fullName} sẽ MẤT toàn bộ quyền quản trị và chỉ còn là người dùng. Người này sẽ phải đăng nhập lại.`,
      confirmText: toAdmin ? "Cấp quyền quản trị" : "Hạ quyền",
      tone: "danger",
    });
    if (!ok) return;
    await run(() => adminCustomerService.setRole(customer.id, actions.nextRole), toAdmin ? "Đã cấp quyền quản trị" : "Đã hạ quyền xuống người dùng");
  };

  const run = async (action: () => Promise<Partial<AdminCustomerDetail>>, success: string) => {
    setBusy(true);
    try {
      merge(await action());
      notify("success", success);
    } catch (e) {
      notify("error", adminErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link href="/admin/customers" className="text-sm text-gold-deep hover:underline">&larr; Quay lại danh sách</Link>

      <section className="rounded-lg border border-line bg-paper p-4 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-ink">{customer.fullName}</h2>
            <p className="text-sm text-muted">{customer.phone} · {customer.email ?? "Chưa có email"}</p>
            <p className="text-xs text-muted">Đăng ký {formatLocal(customer.createdAt)} · {ROLE_LABEL[customer.role]}</p>
          </div>
          <CustomerBadges c={customer} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {actions.canLock && <Button variant="ghost" className="text-danger! hover:bg-danger/10!" disabled={busy} onClick={lock}>Khóa tài khoản</Button>}
          {actions.canUnlock && <Button variant="secondary" disabled={busy} onClick={unlock}>Mở khóa tài khoản</Button>}
          <Button variant="secondary" disabled={busy || !actions.canChangeRole} onClick={changeRole}>
            {actions.nextRole === "admin" ? "Cấp quyền quản trị" : "Hạ quyền xuống người dùng"}
          </Button>
          {(actions.lockHint || actions.roleHint) && (
            <p className="text-xs text-muted" data-testid="action-hint">{[actions.lockHint, actions.roleHint].filter(Boolean).join(" · ")}</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Số đơn" value={customer.orderCount} />
        <Stat label="Tổng chi tiêu" value={formatVND(customer.totalSpent)} />
        <Stat label="Địa chỉ" value={customer.addressCount} />
        <Stat label="Đánh giá" value={customer.reviewCount} />
        <Stat label="Yêu thích" value={customer.wishlistCount} />
      </div>

      <section className="rounded-lg border border-line bg-paper p-4 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-xl text-ink">Đơn hàng gần nhất</h2>
          <ButtonLink href={`/admin/orders?userId=${customer.id}`} size="sm" variant="secondary">Xem tất cả đơn</ButtonLink>
        </div>
        {customer.recentOrders.length === 0 ? (
          <p className="rounded-ui bg-sand px-4 py-6 text-center text-sm text-muted">Khách chưa có đơn hàng.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-120 text-left text-[13px]">
              <caption className="sr-only">Đơn hàng gần nhất</caption>
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th scope="col" className="py-1.5 font-semibold">Mã đơn</th>
                  <th scope="col" className="py-1.5 font-semibold">Ngày đặt</th>
                  <th scope="col" className="py-1.5 font-semibold">Trạng thái</th>
                  <th scope="col" className="py-1.5 text-right font-semibold">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {customer.recentOrders.map((o) => (
                  <tr key={o.code}>
                    <td className="py-2 font-mono text-xs font-semibold">
                      {/* Hợp đồng chưa trả id đơn trong recentOrders: có id thì vào chi tiết, không thì tìm theo mã. */}
                      <Link href={o.id ? `/admin/orders/${o.id}` : `/admin/orders?q=${encodeURIComponent(o.code)}`} className="hover:text-gold-deep hover:underline">{o.code}</Link>
                    </td>
                    <td className="py-2">{formatLocal(o.createdAt)}</td>
                    <td className="py-2"><span className="flex flex-wrap gap-1"><OrderStatusBadge status={o.status} /><PaymentStatusBadge status={o.paymentStatus} /></span></td>
                    <td className="py-2 text-right font-medium">{formatVND(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
