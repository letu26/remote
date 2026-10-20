"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminForm } from "@/hooks/useAdminForm";
import type { CrudService } from "@/services/admin-catalog.service";
import { confirmAction } from "@/utils/confirm";
import { notify } from "@/utils/notify";
import type { FormErrors } from "@/utils/validators";
import { adminErrorMessage, isInUse } from "./admin-errors";

export interface CrudColumn<T> {
  header: string;
  cell: (row: T, rows: T[]) => ReactNode;
  className?: string;
}

export interface FieldsContext<V, T> {
  values: V;
  errors: FormErrors;
  /** Đặt giá trị một trường và xóa lỗi của trường đó. */
  set: <K extends keyof V>(key: K, value: V[K]) => void;
  rows: T[];
  editing: T | null;
}

export interface CrudConfig<T extends { id: number; name: string; isActive: boolean }, V, I> {
  /** Tên thực thể viết thường, ví dụ "danh mục". */
  entity: string;
  title: string;
  service: CrudService<T, I>;
  columns: CrudColumn<T>[];
  emptyValues: V;
  toValues: (row: T) => V;
  validate: (values: V) => FormErrors;
  toInput: (values: V, editing: T | null) => I;
  renderFields: (ctx: FieldsContext<V, T>) => ReactNode;
  /** Mã lỗi 409 -> tên ô. */
  codeFields?: Record<string, string>;
  /** Sắp xếp/biến đổi danh sách hiển thị (ví dụ dựng cây). */
  arrange?: (rows: T[]) => T[];
  /** Cỡ modal thêm/sửa (mặc định md). */
  modalSize?: "sm" | "md" | "lg";
  /** Trả false để ẩn nút Xóa của dòng (ví dụ trang hệ thống). */
  canDelete?: (row: T) => boolean;
  /** Trả thông báo để CHẶN xóa (ví dụ mục menu còn con); null/undefined = cho phép. */
  beforeDelete?: (row: T, rows: T[]) => string | null | undefined;
  /** Nút phụ trên mỗi dòng (ví dụ lên/xuống). */
  rowActions?: (ctx: { row: T; rows: T[]; shown: T[]; reload: () => void }) => ReactNode;
  /** Nạp dữ liệu đầy đủ của dòng trước khi mở form sửa (khi danh sách không kèm đủ trường). */
  loadForEdit?: (row: T) => Promise<T>;
}

type Status = "loading" | "error" | "ready";

/** Khung CRUD dùng chung: bảng + modal thêm/sửa + xóa có xác nhận + ẩn/hiện nhanh. */
export function CrudPage<T extends { id: number; name: string; isActive: boolean }, V, I>({
  config,
}: {
  config: CrudConfig<T, V, I>;
}) {
  const { entity, service, columns, arrange } = config;
  const [rows, setRows] = useState<T[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [values, setValues] = useState<V>(config.emptyValues);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { errors, submitting, submit, clearError, reset } = useAdminForm(config.codeFields);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setRows(await service.list());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [service]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu lần đầu
    void load();
  }, [load]);

  const shown = useMemo(() => (arrange ? arrange(rows) : rows), [rows, arrange]);

  const openForm = async (row: T | null) => {
    let target = row;
    if (row && config.loadForEdit) {
      setBusyId(row.id);
      try {
        target = await config.loadForEdit(row);
      } catch (err) {
        notify("error", adminErrorMessage(err));
        return;
      } finally {
        setBusyId(null);
      }
    }
    setEditing(target);
    setValues(target ? config.toValues(target) : config.emptyValues);
    reset();
    setFormOpen(true);
  };

  const closeForm = () => {
    if (!submitting) setFormOpen(false);
  };

  const set = <K extends keyof V>(key: K, value: V[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(String(key));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await submit(config.validate(values), async () => {
      const input = config.toInput(values, editing);
      if (editing) await service.update(editing.id, input as Partial<I>);
      else await service.create(input);
    });
    if (ok) {
      setFormOpen(false);
      notify("success", editing ? `Đã cập nhật ${entity}` : `Đã thêm ${entity}`);
      void load();
    }
  };

  const toggleActive = async (row: T) => {
    setBusyId(row.id);
    try {
      await service.update(row.id, { isActive: !row.isActive } as unknown as Partial<I>);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: !row.isActive } : r)));
      notify("success", row.isActive ? `Đã ẩn ${entity}` : `Đã hiện ${entity}`);
    } catch (err) {
      notify("error", adminErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const askDelete = async (row: T) => {
    const blocked = config.beforeDelete?.(row, rows);
    if (blocked) {
      notify("warning", blocked);
      return;
    }
    const ok = await confirmAction({
      title: `Xóa ${entity}`,
      text: `Bạn có chắc muốn xóa ${entity} "${row.name}"? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(row.id);
    try {
      await service.remove(row.id);
      notify("success", `Đã xóa ${entity}`);
      void load();
    } catch (err) {
      notify("error", adminErrorMessage(err));
      if (isInUse(err) && row.isActive) {
        const hide = await confirmAction({
          title: `Không thể xóa ${entity}`,
          text: `Bạn có thể ẩn ${entity} này thay vì xóa.`,
          confirmText: `Ẩn ${entity} này`,
        });
        if (hide) await toggleActive(row);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{status === "ready" ? `${rows.length} ${entity}` : ""}</p>
        <Button onClick={() => openForm(null)}>Thêm {entity}</Button>
      </div>

      {status === "loading" && (
        <div className="space-y-2" aria-busy="true" aria-label="Đang tải">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "ready" && rows.length === 0 && (
        <EmptyState title={`Chưa có ${entity} nào`} description={`Nhấn "Thêm ${entity}" để tạo mới.`} />
      )}
      {status === "ready" && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper shadow-card">
          <table className="w-full min-w-160 text-left text-[13px]">
            <caption className="sr-only">{config.title}</caption>
            <thead className="bg-sand text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {columns.map((c) => (
                  <th key={c.header} scope="col" className={`px-3 py-2 font-semibold ${c.className ?? ""}`}>
                    {c.header}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 font-semibold">Trạng thái</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((row) => (
                <tr key={row.id} className={row.isActive ? "" : "bg-sand/50"}>
                  {columns.map((c) => (
                    <td key={c.header} className={`px-3 py-2 align-middle ${c.className ?? ""}`}>
                      {c.cell(row, rows)}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "Đang hiện" : "Đã ẩn"}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      {config.rowActions?.({ row, rows, shown, reload: () => void load() })}
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busyId === row.id}
                        onClick={() => toggleActive(row)}
                        aria-label={`${row.isActive ? "Ẩn" : "Hiện"} ${row.name}`}
                      >
                        {row.isActive ? "Ẩn" : "Hiện"}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openForm(row)} aria-label={`Sửa ${row.name}`}>
                        Sửa
                      </Button>
                      {(config.canDelete?.(row) ?? true) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger! hover:bg-danger/10!"
                          onClick={() => askDelete(row)}
                          aria-label={`Xóa ${row.name}`}
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Sửa ${entity}` : `Thêm ${entity}`}
        size={config.modalSize}
        footer={
          <>
            <Button variant="ghost" onClick={closeForm} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" form="crud-form" loading={submitting}>
              {editing ? "Lưu thay đổi" : `Thêm ${entity}`}
            </Button>
          </>
        }
      >
        <form id="crud-form" onSubmit={onSubmit} noValidate className="space-y-3">
          {config.renderFields({ values, errors, set, rows, editing })}
        </form>
      </Modal>
    </section>
  );
}
