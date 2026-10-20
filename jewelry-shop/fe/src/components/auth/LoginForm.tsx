"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ROUTES } from "@/constants";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useAuth } from "@/store/auth-context";
import { notify } from "@/utils/notify";
import { redirectTarget } from "@/utils/redirect";
import { validateLogin } from "@/utils/validators";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({ phone: "", password: "" });
  const { errors, submitting, run, clearError } = useFormSubmit();

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    clearError(k);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const phone = values.phone.trim();
    await run(validateLogin({ ...values, phone }), async () => {
      const target = await login(phone, values.password);
      notify("success", "Đăng nhập thành công");
      router.replace(redirectTarget(target));
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Số điện thoại" name="phone" type="tel" inputMode="numeric" autoComplete="username"
        placeholder="0912345678" value={values.phone} onChange={set("phone")} error={errors.phone} />
      <Field label="Mật khẩu" name="password" type="password" autoComplete="current-password"
        value={values.password} onChange={set("password")} error={errors.password} />
      <div className="text-right text-sm">
        <Link href={ROUTES.forgotPassword} className="font-medium text-gold-deep hover:underline">
          Quên mật khẩu?
        </Link>
      </div>
      <Button type="submit" loading={submitting} className="w-full">
        {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
