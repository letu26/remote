"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Field } from "@/components/ui/Field";
import { ROUTES } from "@/constants";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useHydrated } from "@/hooks/useHydrated";
import { authService } from "@/services/auth.service";
import { clearResetFlow, getResetToken, subscribeResetFlow } from "@/store/reset-flow";
import { isApiError } from "@/utils/errors";
import { setFlash } from "@/utils/flash";
import { validateReset } from "@/utils/validators";

export function ResetPasswordForm() {
  const router = useRouter();
  const done = useRef(false);
  const hydrated = useHydrated();
  const token = useSyncExternalStore(subscribeResetFlow, getResetToken, () => null);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [values, setValues] = useState({ newPassword: "", confirmPassword: "" });
  const { errors, submitting, run, clearError } = useFormSubmit();

  // Không có resetToken thì quay về bước 1 (trừ khi vừa báo token hỏng/đã xong).
  useEffect(() => {
    if (hydrated && !token && !tokenInvalid && !done.current) router.replace(ROUTES.forgotPassword);
  }, [hydrated, token, tokenInvalid, router]);

  if (tokenInvalid) {
    return (
      <div className="space-y-5">
        <Alert>Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã OTP mới.</Alert>
        <Link href={ROUTES.forgotPassword} className="block text-center text-sm font-medium text-gold-deep hover:underline">
          Quay lại quên mật khẩu
        </Link>
      </div>
    );
  }
  if (!token) return null;

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    clearError(k);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(validateReset(values), async () => {
      try {
        await authService.resetPassword(token, values.newPassword, values.confirmPassword);
      } catch (err) {
        if (isApiError(err) && err.code === "RESET_TOKEN_INVALID") {
          clearResetFlow();
          setTokenInvalid(true);
        }
        throw err;
      }
    });
    if (ok) {
      done.current = true;
      clearResetFlow();
      setFlash("success", "Đặt lại mật khẩu thành công, vui lòng đăng nhập bằng mật khẩu mới.");
      router.replace(ROUTES.login);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Mật khẩu mới" name="newPassword" type="password" autoComplete="new-password"
        value={values.newPassword} onChange={set("newPassword")} error={errors.newPassword} />
      <Field label="Xác nhận mật khẩu mới" name="confirmPassword" type="password" autoComplete="new-password"
        value={values.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
      <Button type="submit" loading={submitting} className="w-full">
        {submitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
      </Button>
    </form>
  );
}
