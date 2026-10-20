"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ROUTES } from "@/constants";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { authService } from "@/services/auth.service";
import { notify } from "@/utils/notify";
import { validateRegister } from "@/utils/validators";

const initial = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const { errors, submitting, run, clearError } = useFormSubmit();

  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = k === "acceptTerms" ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [k]: value }));
    clearError(k);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = {
      ...values,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    };
    const ok = await run(validateRegister(data), async () => {
      await authService.register(data);
    });
    if (ok) {
      notify("success", "Đăng ký thành công! Vui lòng đăng nhập.");
      router.replace(ROUTES.login);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Họ và tên" name="fullName" autoComplete="name" value={values.fullName}
        onChange={set("fullName")} error={errors.fullName} />
      <Field label="Email" name="email" type="email" autoComplete="email" value={values.email}
        onChange={set("email")} error={errors.email} />
      <Field label="Số điện thoại" name="phone" type="tel" inputMode="numeric" autoComplete="tel"
        placeholder="0912345678" value={values.phone} onChange={set("phone")} error={errors.phone} />
      <Field label="Mật khẩu" name="password" type="password" autoComplete="new-password"
        value={values.password} onChange={set("password")} error={errors.password} />
      <Field label="Xác nhận mật khẩu" name="confirmPassword" type="password" autoComplete="new-password"
        value={values.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
      <div>
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input type="checkbox" name="acceptTerms" checked={values.acceptTerms}
            onChange={set("acceptTerms")} aria-invalid={!!errors.acceptTerms}
            className="mt-0.5 h-4 w-4 accent-[#8c6a1c]" />
          <span>
            Tôi đồng ý với{" "}
            <a href="/pages/dieu-khoan-su-dung" target="_blank" rel="noopener noreferrer" className="font-medium text-gold-deep underline">
              điều khoản sử dụng
            </a>{" "}
            và chính sách bảo mật
          </span>
        </label>
        {errors.acceptTerms && (
          <p role="alert" className="mt-1 text-xs text-danger">{errors.acceptTerms}</p>
        )}
      </div>
      <Button type="submit" loading={submitting} className="w-full">
        {submitting ? "Đang xử lý..." : "Đăng ký"}
      </Button>
    </form>
  );
}
