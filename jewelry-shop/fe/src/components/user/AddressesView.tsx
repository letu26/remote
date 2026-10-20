"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { addressService } from "@/services/address.service";
import type { Address } from "@/types/shop";
import { confirmAction } from "@/utils/confirm";
import { isApiError } from "@/utils/errors";
import { notify } from "@/utils/notify";
import { AddressForm } from "./AddressForm";

export const MAX_ADDRESSES = 10;

export function AddressesView() {
  const { data, loading, failed, reload } = useAsyncData("addresses", () => addressService.list());
  const [form, setForm] = useState<{ editing: Address | null } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const list = data ?? [];

  const openAdd = () => {
    if (list.length >= MAX_ADDRESSES) {
      notify("warning", `Bạn chỉ có thể lưu tối đa ${MAX_ADDRESSES} địa chỉ. Hãy xóa bớt địa chỉ cũ trước khi thêm mới.`);
      return;
    }
    setForm({ editing: null });
  };

  const act = async (id: number, action: () => Promise<void>, success: string) => {
    if (busyId !== null) return;
    setBusyId(id);
    try {
      await action();
      notify("success", success);
      reload();
    } catch (err) {
      notify("error", isApiError(err) ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (a: Address) => {
    const ok = await confirmAction({
      title: "Xóa địa chỉ",
      text: `Bạn có chắc muốn xóa địa chỉ của "${a.receiverName}"?`,
      confirmText: "Xóa",
      tone: "danger",
    });
    if (ok) await act(a.id, () => addressService.remove(a.id), "Đã xóa địa chỉ");
  };

  if (failed) return <ErrorState onRetry={reload} />;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{loading ? "" : `${list.length}/${MAX_ADDRESSES} địa chỉ`}</p>
        <Button onClick={openAdd} disabled={loading}>Thêm địa chỉ</Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Đang tải">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Bạn chưa có địa chỉ nào"
          description="Thêm địa chỉ để đặt hàng nhanh hơn."
          action={<Button onClick={openAdd}>Thêm địa chỉ</Button>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium text-ink">{a.receiverName}</h2>
                <span className="text-sm text-muted">{a.receiverPhone}</span>
                {a.isDefault && <Badge tone="sale">Mặc định</Badge>}
              </div>
              <p className="text-sm text-muted">
                {a.detail}, {a.wardName}, {a.provinceName}
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setForm({ editing: a })} aria-label={`Sửa địa chỉ ${a.receiverName}`}>
                  Sửa
                </Button>
                {!a.isDefault && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === a.id}
                    onClick={() => act(a.id, () => addressService.setDefault(a.id).then(() => undefined), "Đã đặt làm địa chỉ mặc định")}
                    aria-label={`Đặt địa chỉ ${a.receiverName} làm mặc định`}
                  >
                    Đặt mặc định
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger! hover:bg-danger/10!"
                  disabled={busyId === a.id}
                  onClick={() => remove(a)}
                  aria-label={`Xóa địa chỉ ${a.receiverName}`}
                >
                  Xóa
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <AddressForm
          editing={form.editing}
          isFirst={list.length === 0}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            reload();
          }}
        />
      )}
    </section>
  );
}
