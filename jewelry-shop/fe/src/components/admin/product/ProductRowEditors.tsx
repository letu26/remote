"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert, Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { adminProductService } from "@/services/admin-product.service";
import type { AdminNamedItem } from "@/types/admin-catalog";
import { notify } from "@/utils/notify";
import type { FormErrors } from "@/utils/validators";
import { adminErrorMessage } from "../admin-errors";
import { emptyGemRow, emptyVariantRow, removeRow, updateRow, type GemRow, type VariantRow } from "./product-form";

// ---------- Đá quý ----------

export function GemstonesEditor({
  rows,
  gemstones,
  errors,
  onChange,
  onClearError,
}: {
  rows: GemRow[];
  gemstones: AdminNamedItem[];
  errors: FormErrors;
  onChange: (rows: GemRow[]) => void;
  onClearError: (field: string) => void;
}) {
  const options = [{ value: "", label: "Chọn loại đá" }, ...gemstones.map((g) => ({ value: String(g.id), label: g.name }))];
  const patch = (key: string, index: number, field: keyof GemRow, value: string) => {
    onChange(updateRow(rows, key, { [field]: value } as Partial<GemRow>));
    onClearError(`gemstones.${index}.${field}`);
  };
  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-muted">Sản phẩm chưa có đá quý. Nhấn &quot;Thêm đá quý&quot; nếu có.</p>}
      {rows.map((g, i) => (
        <fieldset key={g.key} className="rounded-ui border border-line bg-paper p-3">
          <legend className="px-1 text-xs font-semibold text-muted">Đá quý #{i + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Select label="Loại đá" name={`gemstones.${i}.gemstoneId`} value={g.gemstoneId} options={options} onChange={(e) => patch(g.key, i, "gemstoneId", e.target.value)} />
              {errors[`gemstones.${i}.gemstoneId`] && <p role="alert" className="mt-1 text-xs text-danger">{errors[`gemstones.${i}.gemstoneId`]}</p>}
            </div>
            <Field label="Số lượng" name={`gemstones.${i}.quantity`} inputMode="numeric" value={g.quantity} error={errors[`gemstones.${i}.quantity`]} onChange={(e) => patch(g.key, i, "quantity", e.target.value)} />
            <Field label="Carat" name={`gemstones.${i}.carat`} inputMode="decimal" value={g.carat} error={errors[`gemstones.${i}.carat`]} onChange={(e) => patch(g.key, i, "carat", e.target.value)} />
            <Field label="Màu" name={`gemstones.${i}.color`} value={g.color} error={errors[`gemstones.${i}.color`]} onChange={(e) => patch(g.key, i, "color", e.target.value)} />
            <Field label="Độ tinh khiết" name={`gemstones.${i}.clarity`} value={g.clarity} error={errors[`gemstones.${i}.clarity`]} onChange={(e) => patch(g.key, i, "clarity", e.target.value)} />
            <Field label="Kiểu cắt" name={`gemstones.${i}.cut`} value={g.cut} error={errors[`gemstones.${i}.cut`]} onChange={(e) => patch(g.key, i, "cut", e.target.value)} />
          </div>
          <div className="mt-2 text-right">
            <Button size="sm" variant="ghost" className="text-danger!" onClick={() => onChange(removeRow(rows, g.key))} aria-label={`Xóa đá quý #${i + 1}`}>
              Xóa dòng
            </Button>
          </div>
        </fieldset>
      ))}
      <Button variant="secondary" size="sm" onClick={() => onChange([...rows, emptyGemRow()])}>
        Thêm đá quý
      </Button>
    </div>
  );
}

// ---------- Biến thể / tồn kho ----------

export function VariantsEditor({
  rows,
  errors,
  productId,
  onChange,
  onClearError,
  onStockChanged,
}: {
  rows: VariantRow[];
  errors: FormErrors;
  /** Có giá trị khi đang sửa sản phẩm đã lưu: bật nút Điều chỉnh tồn kho. */
  productId?: number;
  onChange: (rows: VariantRow[]) => void;
  onClearError: (field: string) => void;
  onStockChanged: (variantId: number, stock: number) => void;
}) {
  const [adjusting, setAdjusting] = useState<VariantRow | null>(null);
  const patch = (key: string, index: number, field: keyof VariantRow, value: string | boolean) => {
    onChange(updateRow(rows, key, { [field]: value } as Partial<VariantRow>));
    onClearError(`variants.${index}.${field}`);
    onClearError("variants");
  };
  return (
    <div className="space-y-3">
      {errors.variants && <Alert>{errors.variants}</Alert>}
      {rows.map((v, i) => {
        const saved = productId !== undefined && v.id !== undefined;
        return (
          <fieldset key={v.key} className="rounded-ui border border-line bg-paper p-3">
            <legend className="px-1 text-xs font-semibold text-muted">Biến thể #{i + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="SKU" name={`variants.${i}.sku`} value={v.sku} error={errors[`variants.${i}.sku`]} onChange={(e) => patch(v.key, i, "sku", e.target.value)} />
              <Field label="Size (để trống nếu không có)" name={`variants.${i}.size`} value={v.size} error={errors[`variants.${i}.size`]} onChange={(e) => patch(v.key, i, "size", e.target.value)} />
              {saved ? (
                <div className="space-y-1.5">
                  <span className="block text-sm font-medium text-ink">Tồn kho</span>
                  <div className="flex items-center gap-2">
                    <span className="min-w-8 text-sm font-semibold text-ink" data-testid={`stock-${v.id}`}>{v.stock}</span>
                    <Button size="sm" variant="secondary" onClick={() => setAdjusting(v)} aria-label={`Điều chỉnh tồn kho ${v.sku}`}>
                      Điều chỉnh tồn kho
                    </Button>
                  </div>
                </div>
              ) : (
                <Field label="Tồn kho ban đầu" name={`variants.${i}.stock`} inputMode="numeric" value={v.stock} error={errors[`variants.${i}.stock`]} onChange={(e) => patch(v.key, i, "stock", e.target.value)} />
              )}
              <div className="flex items-end pb-2">
                <Checkbox label="Đang bán" checked={v.isActive} onChange={(e) => patch(v.key, i, "isActive", e.target.checked)} />
              </div>
            </div>
            {!saved && rows.length > 1 && (
              <div className="mt-2 text-right">
                <Button size="sm" variant="ghost" className="text-danger!" onClick={() => onChange(removeRow(rows, v.key))} aria-label={`Xóa biến thể #${i + 1}`}>
                  Xóa dòng
                </Button>
              </div>
            )}
          </fieldset>
        );
      })}
      <Button variant="secondary" size="sm" onClick={() => onChange([...rows, emptyVariantRow()])}>
        Thêm biến thể
      </Button>
      {productId !== undefined && (
        <p className="text-xs text-muted">
          Biến thể đã lưu không xóa được (có thể nằm trong đơn hàng), hãy bỏ chọn &quot;Đang bán&quot; để ẩn. Tồn kho chỉ đổi qua nút Điều chỉnh tồn kho.
        </p>
      )}
      {adjusting && productId !== undefined && adjusting.id !== undefined && (
        <StockModal
          productId={productId}
          variant={adjusting}
          onClose={() => setAdjusting(null)}
          onDone={(stock) => {
            onStockChanged(adjusting.id as number, stock);
            setAdjusting(null);
          }}
        />
      )}
    </div>
  );
}

function StockModal({
  productId,
  variant,
  onClose,
  onDone,
}: {
  productId: number;
  variant: VariantRow;
  onClose: () => void;
  onDone: (stock: number) => void;
}) {
  const [mode, setMode] = useState<"delta" | "set">("delta");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const text = amount.trim();
    const valid = mode === "delta" ? /^-?\d+$/.test(text) && Number(text) !== 0 : /^\d+$/.test(text);
    if (!valid) {
      setError(mode === "delta" ? "Nhập số nguyên khác 0 (âm để trừ kho)" : "Nhập số nguyên từ 0 trở lên");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await adminProductService.changeStock(productId, variant.id as number, mode === "delta" ? { delta: Number(text) } : { set: Number(text) });
      notify("success", `Tồn kho ${res.sku} hiện là ${res.stock}`);
      onDone(res.stock);
    } catch (err) {
      notify("error", adminErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={`Điều chỉnh tồn kho: ${variant.sku}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Hủy</Button>
          <Button type="submit" form="stock-form" loading={busy}>Cập nhật</Button>
        </>
      }
    >
      <form id="stock-form" onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-muted">Tồn kho hiện tại: <strong className="text-ink">{variant.stock}</strong></p>
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        <Select
          label="Cách điều chỉnh"
          name="stock-mode"
          value={mode}
          options={[
            { value: "delta", label: "Cộng/trừ (delta)" },
            { value: "set", label: "Đặt lại số lượng (set)" },
          ]}
          onChange={(e) => {
            setMode(e.target.value as "delta" | "set");
            setError("");
          }}
        />
        <Field
          label={mode === "delta" ? "Số lượng thay đổi (ví dụ -2)" : "Tồn kho mới"}
          name="stock-amount"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </form>
    </Modal>
  );
}
