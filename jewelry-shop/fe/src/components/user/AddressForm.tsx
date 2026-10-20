"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { addressService } from "@/services/address.service";
import { locationService } from "@/services/location.service";
import type { Address } from "@/types/shop";
import { notify } from "@/utils/notify";
import { validateAddress, type AddressFormValues } from "@/utils/validators";

interface Values extends AddressFormValues {
  isDefault: boolean;
}

function initialValues(a: Address | null, isFirst: boolean): Values {
  return {
    receiverName: a?.receiverName ?? "",
    receiverPhone: a?.receiverPhone ?? "",
    provinceId: a ? String(a.provinceId) : "",
    wardId: a ? String(a.wardId) : "",
    detail: a?.detail ?? "",
    isDefault: a?.isDefault ?? isFirst,
  };
}

/** Modal thêm/sửa địa chỉ. Chỉ render khi mở để mỗi lần mở có trạng thái mới. */
export function AddressForm({
  editing,
  isFirst,
  onClose,
  onSaved,
}: {
  editing: Address | null;
  isFirst: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Values>(() => initialValues(editing, isFirst));
  const { errors, submitting, run, clearError } = useFormSubmit();

  const provinces = useAsyncData("provinces", () => locationService.provinces());
  const provinceKey = values.provinceId;
  const wards = useAsyncData(`wards-${provinceKey}`, (signal) =>
    provinceKey ? locationService.wards(Number(provinceKey), signal) : Promise.resolve([]),
  );

  const provinceOptions = useMemo(
    () => (provinces.data ?? []).map((p) => ({ value: String(p.id), label: p.name })),
    [provinces.data],
  );
  const wardOptions = useMemo(
    () => (wards.data ?? []).map((w) => ({ value: String(w.id), label: w.name })),
    [wards.data],
  );

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    clearError(String(key));
  };

  const onProvince = (id: string) => {
    // Đổi tỉnh thì xã/phường cũ không còn hợp lệ.
    setValues((v) => ({ ...v, provinceId: id, wardId: "" }));
    clearError("provinceId");
    clearError("wardId");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(validateAddress(values), async () => {
      const input = {
        receiverName: values.receiverName.trim(),
        receiverPhone: values.receiverPhone.trim(),
        provinceId: Number(values.provinceId),
        wardId: Number(values.wardId),
        detail: values.detail.trim(),
        isDefault: values.isDefault,
      };
      if (editing) await addressService.update(editing.id, input);
      else await addressService.create(input);
    });
    if (ok) {
      notify("success", editing ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ");
      onSaved();
    }
  };

  const wardsLoading = !!values.provinceId && wards.loading;

  return (
    <Modal
      open
      onClose={submitting ? () => {} : onClose}
      title={editing ? "Sửa địa chỉ" : "Thêm địa chỉ"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" form="address-form" loading={submitting}>
            {editing ? "Lưu thay đổi" : "Thêm địa chỉ"}
          </Button>
        </>
      }
    >
      <form id="address-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Họ tên người nhận" name="receiverName" autoComplete="name" value={values.receiverName}
          onChange={(e) => set("receiverName", e.target.value)} error={errors.receiverName} />
        <Field label="Số điện thoại" name="receiverPhone" type="tel" inputMode="numeric" autoComplete="tel"
          value={values.receiverPhone} onChange={(e) => set("receiverPhone", e.target.value)} error={errors.receiverPhone} />
        <SearchSelect label="Tỉnh/Thành phố" name="provinceId" options={provinceOptions} value={values.provinceId}
          onChange={onProvince} loading={provinces.loading} placeholder="Chọn hoặc gõ để tìm tỉnh/thành phố" error={errors.provinceId} />
        <SearchSelect label="Xã/Phường" name="wardId" options={wardOptions} value={values.wardId}
          onChange={(v) => set("wardId", v)} disabled={!values.provinceId} loading={wardsLoading}
          placeholder={values.provinceId ? "Chọn hoặc gõ để tìm xã/phường" : "Hãy chọn tỉnh/thành phố trước"} error={errors.wardId} />
        <Field label="Địa chỉ chi tiết (số nhà, tên đường...)" name="detail" autoComplete="street-address" value={values.detail}
          onChange={(e) => set("detail", e.target.value)} error={errors.detail} />
        <Checkbox
          label="Đặt làm địa chỉ mặc định"
          checked={values.isDefault}
          disabled={editing?.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
        />
      </form>
    </Modal>
  );
}
