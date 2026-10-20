"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ROUTES } from "@/constants";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { authService } from "@/services/auth.service";
import { clearResetFlow, setOtpTimers, setResetEmail } from "@/store/reset-flow";
import { isApiError } from "@/utils/errors";
import { notify } from "@/utils/notify";
import { validateForgot } from "@/utils/validators";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const { errors, submitting, run, clearError } = useFormSubmit();

  // Vào lại bước 1 nghĩa là bắt đầu luồng mới.
  useEffect(() => {
    clearResetFlow();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    const ok = await run(validateForgot({ email: value }), async () => {
      try {
        const res = await authService.forgotPassword(value);
        setResetEmail(value);
        setOtpTimers(res.expiresInSeconds, res.resendAfterSeconds);
        notify("success", res.message);
      } catch (err) {
        if (isApiError(err) && err.code === "OTP_RATE_LIMITED" && err.retryAfterSeconds) {
          throw Object.assign(err, {
            message: `Bạn vừa yêu cầu mã, vui lòng thử lại sau ${err.retryAfterSeconds} giây`,
          });
        }
        throw err;
      }
    });
    if (ok) router.push(ROUTES.verifyOtp);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Email" name="email" type="email" autoComplete="email" value={email}
        onChange={(e) => { setEmail(e.target.value); clearError("email"); }} error={errors.email} />
      <Button type="submit" loading={submitting} className="w-full">
        {submitting ? "Đang gửi..." : "Gửi mã OTP"}
      </Button>
    </form>
  );
}
