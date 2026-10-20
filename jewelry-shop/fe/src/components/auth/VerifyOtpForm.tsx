"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Field";
import { OtpInput } from "@/components/ui/OtpInput";
import { ROUTES } from "@/constants";
import { formatClock, useCountdown } from "@/hooks/useCountdown";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useHydrated } from "@/hooks/useHydrated";
import { authService } from "@/services/auth.service";
import {
  getOtpExpiresAt,
  getResendAt,
  getResetEmail,
  setOtpTimers,
  setResendAt,
  setResetToken,
  subscribeResetFlow,
} from "@/store/reset-flow";
import { isApiError } from "@/utils/errors";
import { notify } from "@/utils/notify";
import { validateOtp } from "@/utils/validators";

const noValue = () => null;

export function VerifyOtpForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const email = useSyncExternalStore(subscribeResetFlow, getResetEmail, noValue);
  const otpExpiresAt = useSyncExternalStore(subscribeResetFlow, getOtpExpiresAt, noValue);
  const resendAt = useSyncExternalStore(subscribeResetFlow, getResendAt, noValue);
  const [otp, setOtp] = useState("");
  // Hết lượt nhập (OTP_TOO_MANY_ATTEMPTS) hoặc server báo hết hạn: bắt buộc gửi lại mã.
  const [blocked, setBlocked] = useState<"attempts" | "expired" | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [resending, setResending] = useState(false);
  const resendLock = useRef(false);
  const { errors, submitting, run, clearError } = useFormSubmit();

  // Không có email của luồng quên mật khẩu thì quay về bước 1.
  useEffect(() => {
    if (hydrated && !email) router.replace(ROUTES.forgotPassword);
  }, [hydrated, email, router]);

  const expiresIn = useCountdown(otpExpiresAt);
  const resendIn = useCountdown(resendAt);
  const expired = blocked !== null || (otpExpiresAt !== null && expiresIn === 0);
  const canResend = resendIn === 0 && !resending;

  if (!email) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (expired) return;
    setAttemptsLeft(null);
    const otpError = validateOtp(otp);
    const ok = await run(otpError ? { otp: otpError } : {}, async () => {
      try {
        const res = await authService.verifyOtp(email, otp);
        setResetToken(res.resetToken);
      } catch (err) {
        if (isApiError(err)) {
          if (err.code === "OTP_EXPIRED") setBlocked("expired");
          if (err.code === "OTP_TOO_MANY_ATTEMPTS") {
            setBlocked("attempts");
            setAttemptsLeft(null);
          }
          if (err.code === "OTP_INVALID") {
            setOtp("");
            setAttemptsLeft(typeof err.remainingAttempts === "number" ? err.remainingAttempts : null);
          }
        }
        throw err;
      }
    });
    if (ok) router.replace(ROUTES.resetPassword);
  };

  const onResend = async () => {
    if (resendLock.current || !canResend) return;
    resendLock.current = true;
    setResending(true);
    try {
      const res = await authService.forgotPassword(email);
      setOtpTimers(res.expiresInSeconds, res.resendAfterSeconds);
      setBlocked(null);
      setAttemptsLeft(null);
      setOtp("");
      notify("success", "Chúng tôi đã gửi mã OTP mới, vui lòng kiểm tra email.");
    } catch (err) {
      if (isApiError(err) && err.code === "OTP_RATE_LIMITED" && err.retryAfterSeconds) {
        setResendAt(Date.now() + err.retryAfterSeconds * 1000);
        notify("warning", `Vui lòng thử lại sau ${err.retryAfterSeconds} giây`);
      } else {
        notify("error", isApiError(err) ? err.message : "Không gửi lại được mã, vui lòng thử lại");
      }
    } finally {
      resendLock.current = false;
      setResending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <p className="text-sm text-muted">
        Mã OTP gồm 6 chữ số đã được gửi tới <strong className="break-all text-ink">{email}</strong> (nếu email tồn tại).
      </p>
      {expired && (
        <Alert>
          {blocked === "attempts"
            ? "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới bằng nút Gửi lại mã."
            : "Mã OTP đã hết hạn hoặc không còn hiệu lực, vui lòng gửi lại mã."}
        </Alert>
      )}
      <div className="space-y-2">
        <OtpInput
          value={otp}
          onChange={(v) => { setOtp(v); clearError("otp"); }}
          disabled={submitting || expired}
          invalid={!!errors.otp}
          errorId="otp-error"
        />
        {attemptsLeft !== null && !expired && (
          <p
            role="status"
            data-testid="attempts-left"
            className={`text-center text-sm font-semibold ${attemptsLeft <= 1 ? "text-danger" : "text-gold-deeper"}`}
          >
            Còn {attemptsLeft} lần thử
          </p>
        )}
        {errors.otp && (
          <p id="otp-error" role="alert" className="text-xs text-danger">{errors.otp}</p>
        )}
      </div>
      <p className="text-center text-sm text-muted">
        {expired ? "Mã đã hết hạn" : <>Mã hết hạn sau <span className="font-semibold text-ink">{formatClock(expiresIn)}</span></>}
      </p>
      <Button type="submit" loading={submitting} disabled={expired} className="w-full">
        {submitting ? "Đang xác thực..." : "Xác nhận"}
      </Button>
      <Button type="button" variant="secondary" onClick={onResend} disabled={!canResend} loading={resending} className="w-full">
        {resendIn > 0 ? `Gửi lại mã (${resendIn}s)` : "Gửi lại mã"}
      </Button>
    </form>
  );
}
