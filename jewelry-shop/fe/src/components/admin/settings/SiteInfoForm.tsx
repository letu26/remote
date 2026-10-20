"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field, inputClass } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminForm } from "@/hooks/useAdminForm";
import { adminSiteInfoService } from "@/services/admin-cms.service";
import type { SiteInfo } from "@/types/admin-cms";
import { notify } from "@/utils/notify";
import type { FormErrors } from "@/utils/validators";
import { validateEmailOrEmpty, validateHttpsUrl } from "../cms/cms-validation";

const EMPTY: SiteInfo = {
  brandName: "", slogan: "", hotline: "", email: "", address: "", openingHours: "",
  facebook: "", zalo: "", instagram: "", tiktok: "", footerText: "",
};

const max = (v: string, n: number, label: string) => (v.trim().length > n ? `${label} tối đa ${n} ký tự` : undefined);

export function validateSiteInfo(v: SiteInfo): FormErrors {
  const checks: Record<string, string | undefined> = {
    brandName: v.brandName.trim().length < 1 || v.brandName.trim().length > 60 ? "Tên thương hiệu từ 1 đến 60 ký tự" : undefined,
    slogan: max(v.slogan, 150, "Khẩu hiệu"),
    hotline: max(v.hotline, 30, "Hotline"),
    email: validateEmailOrEmpty(v.email),
    address: max(v.address, 255, "Địa chỉ"),
    openingHours: max(v.openingHours, 100, "Giờ mở cửa"),
    facebook: validateHttpsUrl(v.facebook),
    zalo: validateHttpsUrl(v.zalo),
    instagram: validateHttpsUrl(v.instagram),
    tiktok: validateHttpsUrl(v.tiktok),
    footerText: max(v.footerText, 300, "Nội dung chân trang"),
  };
  const out: FormErrors = {};
  for (const [k, m] of Object.entries(checks)) if (m) out[k] = m;
  return out;
}

export function SiteInfoForm() {
  const [values, setValues] = useState<SiteInfo>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const { errors, submitting, submit, clearError } = useAdminForm();

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setValues({ ...EMPTY, ...(await adminSiteInfoService.get()) });
      setLoaded(true);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu lần đầu
    void load();
  }, [load]);

  const set = (key: keyof SiteInfo, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await submit(validateSiteInfo(values), async () => {
      const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])) as unknown as SiteInfo;
      const saved = await adminSiteInfoService.save(trimmed);
      if (saved) setValues({ ...EMPTY, ...saved });
    });
    if (ok) notify("success", "Đã lưu thông tin cửa hàng");
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

  const f = (key: keyof SiteInfo, label: string, extra: { maxLength?: number; type?: string; placeholder?: string } = {}) => (
    <Field label={label} name={key} value={values[key]} error={errors[key]} onChange={(e) => set(key, e.target.value)} {...extra} />
  );

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Thông tin cửa hàng" className="max-w-2xl space-y-4 rounded-lg border border-line bg-paper p-5 shadow-card">
      <p className="text-sm text-muted">Hiển thị ở đầu/chân trang cửa hàng và trên hóa đơn in.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {f("brandName", "Tên thương hiệu", { maxLength: 60 })}
        {f("slogan", "Khẩu hiệu", { maxLength: 150 })}
        {f("hotline", "Hotline", { maxLength: 30 })}
        {f("email", "Email", { maxLength: 150 })}
      </div>
      {f("address", "Địa chỉ", { maxLength: 255 })}
      {f("openingHours", "Giờ mở cửa", { maxLength: 100 })}
      <div className="grid gap-4 sm:grid-cols-2">
        {f("facebook", "Facebook (https://...)", { maxLength: 255 })}
        {f("zalo", "Zalo (https://...)", { maxLength: 255 })}
        {f("instagram", "Instagram (https://...)", { maxLength: 255 })}
        {f("tiktok", "TikTok (https://...)", { maxLength: 255 })}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="footerText" className="block text-sm font-medium text-ink">Nội dung chân trang</label>
        <textarea id="footerText" name="footerText" rows={3} maxLength={300} aria-invalid={!!errors.footerText} className={inputClass(!!errors.footerText)} value={values.footerText} onChange={(e) => set("footerText", e.target.value)} />
        {errors.footerText && <p role="alert" className="text-xs text-danger">{errors.footerText}</p>}
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>Lưu thông tin cửa hàng</Button>
      </div>
    </form>
  );
}
