"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ROUTES } from "@/constants";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { userService } from "@/services/user.service";
import { clearToken } from "@/store/token-store";
import { setFlash } from "@/utils/flash";
import { validateChangePassword } from "@/utils/validators";

const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const router = useRouter();
  const [values, setValues] = useState(empty);
  const { errors, submitting, run, clearError } = useFormSubmit();

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    clearError(k);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(validateChangePassword(values), async () => {
      await userService.changePassword(values);
    });
    if (ok) {
      // Backend đã thu hồi mọi token cũ: xóa token và đăng nhập lại.
      clearToken();
      setFlash("success", "Đổi mật khẩu thành công, vui lòng đăng nhập lại");
      router.replace(ROUTES.login);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Mật khẩu hiện tại" name="currentPassword" type="password" autoComplete="current-password"
        value={values.currentPassword} onChange={set("currentPassword")} error={errors.currentPassword} />
      <Field label="Mật khẩu mới" name="newPassword" type="password" autoComplete="new-password"
        value={values.newPassword} onChange={set("newPassword")} error={errors.newPassword} />
      <Field label="Xác nhận mật khẩu mới" name="confirmPassword" type="password" autoComplete="new-password"
        value={values.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
      <Button type="submit" loading={submitting}>{submitting ? "Đang xử lý..." : "Đổi mật khẩu"}</Button>
    </form>
  );
}
