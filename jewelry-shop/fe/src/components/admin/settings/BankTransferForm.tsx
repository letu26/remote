"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminForm } from "@/hooks/useAdminForm";
import { adminSettingsService } from "@/services/admin-settings.service";
import type { BankTransferSettings } from "@/types/admin-order";
import { notify } from "@/utils/notify";
import type { FormErrors } from "@/utils/validators";

export const ORDER_CODE_TOKEN = "{orderCode}";
export const SAMPLE_ORDER_CODE = "LG20261017-483920";

export function validateBankTransfer(v: BankTransferSettings): FormErrors {
  const e: FormErrors = {};
  const bank = v.bankName.trim();
  if (bank.length < 1 || bank.length > 100) e.bankName = "Tên ngân hàng từ 1 đến 100 ký tự";
  const acc = v.accountNumber.trim();
  if (!/^[0-9 ]+$/.test(acc) || acc.replace(/ /g, "").length < 4 || acc.length > 30)
    e.accountNumber = "Số tài khoản từ 4 đến 30 ký tự, chỉ gồm chữ số hoặc khoảng trắng";
  const holder = v.accountHolder.trim();
  if (holder.length < 1 || holder.length > 100) e.accountHolder = "Chủ tài khoản từ 1 đến 100 ký tự";
  const note = v.transferNote.trim();
  if (note.length < 1 || note.length > 100) e.transferNote = "Mẫu nội dung từ 1 đến 100 ký tự";
  else if (!note.includes(ORDER_CODE_TOKEN)) e.transferNote = `Mẫu nội dung phải chứa ${ORDER_CODE_TOKEN}`;
  return e;
}

export function transferPreview(template: string, code = SAMPLE_ORDER_CODE): string {
  return template.split(ORDER_CODE_TOKEN).join(code);
}

const EMPTY: BankTransferSettings = { bankName: "", accountNumber: "", accountHolder: "", transferNote: ORDER_CODE_TOKEN };

export function BankTransferForm() {
  const [values, setValues] = useState<BankTransferSettings>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const { errors, submitting, submit, clearError } = useAdminForm();

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setValues(await adminSettingsService.getBankTransfer());
      setLoaded(true);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu lần đầu
    void load();
  }, [load]);

  const set = (key: keyof BankTransferSettings, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await submit(validateBankTransfer(values), async () => {
      const saved = await adminSettingsService.saveBankTransfer({
        bankName: values.bankName.trim(),
        accountNumber: values.accountNumber.trim(),
        accountHolder: values.accountHolder.trim(),
        transferNote: values.transferNote.trim(),
      });
      if (saved) setValues(saved);
    });
    if (ok) notify("success", "Đã lưu thông tin chuyển khoản");
  };

  if (failed) return <ErrorState onRetry={load} />;
  if (!loaded)
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Thông tin chuyển khoản" className="mx-auto max-w-xl space-y-4 rounded-2xl border border-line bg-paper p-5 shadow-card">
      <p className="text-sm text-muted">Khách chọn thanh toán chuyển khoản sẽ thấy thông tin này sau khi đặt hàng.</p>
      <Field label="Ngân hàng" name="bankName" value={values.bankName} error={errors.bankName} maxLength={100} onChange={(e) => set("bankName", e.target.value)} />
      <Field label="Số tài khoản" name="accountNumber" inputMode="numeric" value={values.accountNumber} error={errors.accountNumber} maxLength={30} onChange={(e) => set("accountNumber", e.target.value)} />
      <Field label="Chủ tài khoản" name="accountHolder" value={values.accountHolder} error={errors.accountHolder} maxLength={100} onChange={(e) => set("accountHolder", e.target.value)} />
      <div>
        <Field label="Mẫu nội dung chuyển khoản" name="transferNote" value={values.transferNote} error={errors.transferNote} maxLength={100} onChange={(e) => set("transferNote", e.target.value)} />
        <p className="mt-1.5 text-xs text-muted">
          Bắt buộc chứa <code className="rounded bg-sand px-1">{ORDER_CODE_TOKEN}</code>, hệ thống thay bằng mã đơn khi hiển thị cho khách.
        </p>
        <p className="mt-1 text-xs text-ink" data-testid="transfer-preview">
          Xem trước: <strong>{transferPreview(values.transferNote)}</strong>
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>Lưu cài đặt</Button>
      </div>
    </form>
  );
}
