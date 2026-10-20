"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useAdminForm } from "@/hooks/useAdminForm";
import { useDebounce } from "@/hooks/useDebounce";
import { adminProductService } from "@/services/admin-product.service";
import { adminPromotionService } from "@/services/admin-promotion.service";
import type { AdminProductListItem } from "@/types/admin-catalog";
import type { AdminPromotion } from "@/types/admin-promotion";
import { formatVND } from "@/utils/format";
import { notify } from "@/utils/notify";
import { fromLocalInputValue } from "../dashboard/date-utils";
import {
  MAX_PRODUCTS,
  emptyPromotionForm,
  findOverlaps,
  previewPrice,
  promotionToForm,
  toCreateInput,
  toUpdateInput,
  validatePromotionForm,
  type PickedProduct,
  type PromotionFormValues,
} from "./promotion-form";

export function PromotionModal({
  open,
  editing,
  loaded,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: AdminPromotion | null;
  /** Khuyến mại đã tải ở danh sách, dùng để cảnh báo trùng thời gian. */
  loaded: AdminPromotion[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const mode = editing ? "edit" : "create";
  const [values, setValues] = useState<PromotionFormValues>(emptyPromotionForm);
  const [search, setSearch] = useState("");
  const q = useDebounce(search.trim(), 500);
  const [results, setResults] = useState<AdminProductListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const { errors, submitting, submit, clearError, reset } = useAdminForm();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- khởi tạo form mỗi lần mở
    setValues(editing ? promotionToForm(editing) : emptyPromotionForm());
    setSearch("");
    setResults([]);
    reset();
    if (editing) {
      // Giá niêm yết để minh họa giá sau giảm (không bắt buộc).
      adminProductService
        .get(editing.productId)
        .then((p) => setValues((v) => ({ ...v, products: v.products.map((x) => ({ ...x, price: p.price })) })))
        .catch(() => {});
    }
  }, [open, editing, reset]);

  useEffect(() => {
    if (!open || mode === "edit" || !q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- xóa kết quả khi ô tìm rỗng
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    adminProductService
      .list({ q, pageSize: 20 })
      .then((res) => !cancelled && setResults(res.items))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setSearching(false));
    return () => {
      cancelled = true;
    };
  }, [q, open, mode]);

  const set = <K extends keyof PromotionFormValues>(key: K, value: PromotionFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key === "products" ? "productIds" : key);
  };

  const toggle = (p: AdminProductListItem) => {
    const exists = values.products.some((x) => x.id === p.id);
    if (!exists && values.products.length >= MAX_PRODUCTS) {
      notify("warning", `Tối đa ${MAX_PRODUCTS} sản phẩm mỗi lần`);
      return;
    }
    const next: PickedProduct[] = exists
      ? values.products.filter((x) => x.id !== p.id)
      : [...values.products, { id: p.id, code: p.code, name: p.name, price: p.price }];
    set("products", next);
  };

  const overlaps = useMemo(
    () => findOverlaps(loaded, values.products.map((p) => p.id), fromLocalInputValue(values.startsAt), fromLocalInputValue(values.endsAt), editing?.id),
    [loaded, values.products, values.startsAt, values.endsAt, editing],
  );

  const pct = Number(values.discountPercent);
  const first = values.products[0];
  const showPreview = first && first.price > 0 && Number.isInteger(pct) && pct >= 1 && pct <= 90;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await submit(validatePromotionForm(values, mode), async () => {
      if (editing) await adminPromotionService.update(editing.id, toUpdateInput(values));
      else await adminPromotionService.create(toCreateInput(values));
    });
    if (ok) {
      notify("success", editing ? "Đã cập nhật khuyến mại" : `Đã tạo khuyến mại cho ${values.products.length} sản phẩm`);
      onSaved();
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={editing ? "Sửa khuyến mại" : "Thêm khuyến mại"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button type="submit" form="promotion-form" loading={submitting}>{editing ? "Lưu thay đổi" : "Tạo khuyến mại"}</Button>
        </>
      }
    >
      <form id="promotion-form" onSubmit={onSubmit} noValidate className="space-y-3">
        <Field label="Tên khuyến mại" name="name" value={values.name} error={errors.name} maxLength={150} onChange={(e) => set("name", e.target.value)} />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">Sản phẩm áp dụng {mode === "create" && <span className="text-muted">({values.products.length}/{MAX_PRODUCTS} đã chọn)</span>}</legend>
          {mode === "edit" ? (
            <p className="rounded-ui bg-sand px-3 py-2 text-sm">
              {values.products[0]?.name} <span className="font-mono text-xs text-muted">({values.products[0]?.code})</span>
              <span className="mt-0.5 block text-xs text-muted">Không đổi được sản phẩm; muốn đổi hãy xóa và tạo lại.</span>
            </p>
          ) : (
            <>
              <Field label="Tìm sản phẩm" name="product-search" type="search" placeholder="Tên hoặc mã sản phẩm" value={search} onChange={(e) => setSearch(e.target.value)} />
              {searching && <p className="text-xs text-muted">Đang tìm...</p>}
              {q && !searching && results.length === 0 && <p className="text-xs text-muted">Không tìm thấy sản phẩm.</p>}
              {results.length > 0 && (
                <ul className="max-h-48 divide-y divide-line overflow-y-auto rounded-ui border border-line bg-paper">
                  {results.map((p) => (
                    <li key={p.id} className="px-3 py-1.5">
                      <Checkbox
                        label={<span className="text-sm">{p.name} <span className="font-mono text-xs text-muted">({p.code})</span> · {formatVND(p.price)}</span>}
                        checked={values.products.some((x) => x.id === p.id)}
                        onChange={() => toggle(p)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {values.products.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Sản phẩm đã chọn">
                  {values.products.map((p) => (
                    <li key={p.id} className="inline-flex items-center gap-1 rounded-full bg-gold-tint px-2.5 py-0.5 text-xs text-gold-deeper">
                      {p.code}
                      <button type="button" onClick={() => set("products", values.products.filter((x) => x.id !== p.id))} aria-label={`Bỏ chọn ${p.name}`} className="ml-0.5 font-bold hover:text-danger">×</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {errors.productIds && <p role="alert" className="text-xs text-danger">{errors.productIds}</p>}
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Phần trăm giảm (1-90)" name="discountPercent" inputMode="numeric" value={values.discountPercent} error={errors.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} />
          <Field label="Bắt đầu" name="startsAt" type="datetime-local" value={values.startsAt} error={errors.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          <Field label="Kết thúc" name="endsAt" type="datetime-local" value={values.endsAt} error={errors.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </div>

        {showPreview && (
          <p className="rounded-ui bg-sand px-3 py-2 text-sm" data-testid="price-preview">
            Minh họa với <strong>{first.name}</strong>: {formatVND(first.price)} → <strong className="text-sale">{formatVND(previewPrice(first.price, pct))}</strong>
          </p>
        )}
        {overlaps.length > 0 && (
          <div role="status" className="rounded-ui border border-gold/60 bg-gold-tint px-3 py-2 text-sm text-gold-deeper" data-testid="overlap-warning">
            Có khuyến mại khác trùng thời gian ({overlaps.map((o) => `${o.name} - ${o.productCode} (${o.discountPercent}%)`).join("; ")}). Hệ thống sẽ lấy mức giảm cao nhất.
          </div>
        )}

        <Checkbox label="Bật khuyến mại" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
      </form>
    </Modal>
  );
}
