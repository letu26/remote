"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { zalopayService } from "@/services/zalopay.service";
import type { ZaloPayPayment } from "@/types/zalopay";
import { isApiError } from "@/utils/errors";
import { formatVND } from "@/utils/format";
import { notify } from "@/utils/notify";

const POLL_INTERVAL_MS = 4000;

type Phase = "loading" | "ready" | "expired" | "error";

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Thanh toán đơn bằng ZaloPay: hiện mã QR để quét bằng app ZaloPay, tự kiểm tra trạng thái mỗi vài giây,
 * hết hạn (15 phút) thì cho tạo mã mới. `onPaid` được gọi một lần khi be xác nhận đã thanh toán.
 */
export function ZaloPayBox({ orderCode, onPaid }: { orderCode: string; onPaid: () => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [payment, setPayment] = useState<ZaloPayPayment | null>(null);
  const [message, setMessage] = useState("");
  const [remaining, setRemaining] = useState(0);
  const startedRef = useRef(false);
  const paidRef = useRef(false);

  const create = useCallback(async () => {
    setPhase("loading");
    setMessage("");
    try {
      const next = await zalopayService.createPayment(orderCode);
      setPayment(next);
      setRemaining(new Date(next.expiresAt).getTime() - Date.now());
      setPhase("ready");
    } catch (err) {
      setMessage(isApiError(err) ? err.message : "Không tạo được mã thanh toán, vui lòng thử lại");
      setPhase("error");
    }
  }, [orderCode]);

  // Chỉ tạo mã một lần khi mở (tránh tạo trùng khi React chạy hiệu ứng hai lần ở chế độ dev).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void create();
  }, [create]);

  // Đếm ngược đến lúc mã hết hạn.
  useEffect(() => {
    if (phase !== "ready" || !payment) return;
    const end = new Date(payment.expiresAt).getTime();
    const id = window.setInterval(() => {
      const left = end - Date.now();
      setRemaining(left);
      if (left <= 0) setPhase("expired");
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, payment]);

  // Hỏi be trạng thái; be vừa nhận callback của ZaloPay vừa chủ động hỏi ZaloPay.
  useEffect(() => {
    if (phase !== "ready") return;
    const controller = new AbortController();
    const check = async () => {
      try {
        const result = await zalopayService.status(orderCode, controller.signal);
        if (result.status === "paid" && !paidRef.current) {
          paidRef.current = true;
          notify("success", "Đã nhận thanh toán ZaloPay, cảm ơn bạn!");
          onPaid();
        } else if (result.status === "expired") {
          setPhase("expired");
        }
      } catch {
        /* lỗi mạng tạm thời: lần hỏi sau sẽ thử lại */
      }
    };
    const id = window.setInterval(check, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      controller.abort();
    };
  }, [phase, orderCode, onPaid]);

  return (
    <section aria-label="Thanh toán ZaloPay" className="rounded-2xl border border-gold bg-gold-tint p-4 sm:p-5">
      <h2 className="font-serif text-xl text-ink">Thanh toán bằng ZaloPay</h2>
      <p className="mt-1 text-sm text-muted">Mở app ZaloPay, chọn quét mã QR rồi quét mã bên dưới. Đơn sẽ tự cập nhật sau khi thanh toán.</p>

      {phase === "loading" && (
        <div className="mt-4 flex justify-center py-8">
          <Spinner label="Đang tạo mã thanh toán..." />
        </div>
      )}

      {phase === "ready" && payment && (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
          <div className="rounded-xl border border-line bg-white p-3 shadow-card">
            <QRCodeSVG value={payment.orderUrl} size={176} marginSize={1} title="Mã QR thanh toán ZaloPay" />
          </div>
          <div className="space-y-2 text-center text-sm sm:text-left">
            <p>
              Số tiền: <strong className="text-base text-ink">{formatVND(payment.amount)}</strong>
            </p>
            <p className="text-muted">
              Mã hết hạn sau{" "}
              <strong className={remaining < 60_000 ? "text-danger" : "text-ink"} aria-live="off">
                {formatRemaining(remaining)}
              </strong>
            </p>
            <a href={payment.orderUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-medium text-gold-deep underline">
              Đang dùng điện thoại? Mở trang thanh toán ZaloPay
            </a>
            <p className="flex items-center justify-center gap-2 text-xs text-muted sm:justify-start">
              <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-gold-deep" />
              Đang chờ bạn thanh toán...
            </p>
          </div>
        </div>
      )}

      {phase === "expired" && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-muted">Mã thanh toán đã hết hạn. Bạn có thể tạo mã mới để tiếp tục thanh toán.</p>
          <Button onClick={() => void create()}>Tạo mã mới</Button>
        </div>
      )}

      {phase === "error" && (
        <div className="mt-4 space-y-3 text-sm">
          <p role="alert" className="text-danger">{message}</p>
          <Button variant="secondary" onClick={() => void create()}>Thử lại</Button>
        </div>
      )}
    </section>
  );
}
