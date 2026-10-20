import { Checkbox } from "@/components/ui/Checkbox";
import { Field, inputClass } from "@/components/ui/Field";
import { adminShippingService } from "@/services/admin-shipping.service";
import type { AdminShippingMethod, ShippingMethodInput } from "@/types/admin-order";
import { formatVND } from "@/utils/format";
import type { FormErrors } from "@/utils/validators";
import { NAME_CODE_FIELD } from "./admin-errors";
import { validateName } from "./catalog-configs";
import type { CrudConfig } from "./CrudPage";

export interface ShippingValues {
  name: string;
  description: string;
  fee: string;
  isActive: boolean;
}

export function validateShipping(v: ShippingValues): FormErrors {
  const e: FormErrors = {};
  const name = validateName(v.name, "Tên phương thức");
  if (name) e.name = name;
  if (!/^\d+$/.test(v.fee.trim())) e.fee = "Phí vận chuyển là số nguyên từ 0 trở lên";
  return e;
}

export const shippingConfig: CrudConfig<AdminShippingMethod, ShippingValues, ShippingMethodInput> = {
  entity: "phương thức vận chuyển",
  title: "Danh sách phương thức vận chuyển",
  service: adminShippingService,
  codeFields: NAME_CODE_FIELD,
  emptyValues: { name: "", description: "", fee: "0", isActive: true },
  toValues: (r) => ({ name: r.name, description: r.description ?? "", fee: String(r.fee), isActive: r.isActive }),
  validate: validateShipping,
  toInput: (v) => ({ name: v.name.trim(), description: v.description.trim(), fee: Number(v.fee), isActive: v.isActive }),
  columns: [
    { header: "Tên", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { header: "Mô tả", cell: (r) => <span className="line-clamp-2 max-w-xs text-muted">{r.description || "-"}</span> },
    { header: "Phí", cell: (r) => formatVND(r.fee) },
  ],
  renderFields: ({ values, errors, set }) => (
    <>
      <Field label="Tên phương thức" name="name" value={values.name} error={errors.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-ink">Mô tả</label>
        <textarea id="description" name="description" rows={2} className={inputClass()} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <Field label="Phí vận chuyển (₫)" name="fee" inputMode="numeric" value={values.fee} error={errors.fee} onChange={(e) => set("fee", e.target.value)} />
      <Checkbox label="Đang bật (khách chọn được khi thanh toán)" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
    </>
  ),
};
