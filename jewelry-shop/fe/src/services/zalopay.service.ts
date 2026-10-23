import { http } from "@/services/http";
import type { ZaloPayPayment, ZaloPayStatus } from "@/types/zalopay";

export const zalopayService = {
  /** Tạo mã QR thanh toán cho đơn (đang còn mã hợp lệ thì be trả lại mã cũ). */
  createPayment: (orderCode: string) =>
    http.post<ZaloPayPayment>(`/payments/zalopay/orders/${encodeURIComponent(orderCode)}`).then((r) => r.data),
  status: (orderCode: string, signal?: AbortSignal) =>
    http.get<ZaloPayStatus>(`/payments/zalopay/orders/${encodeURIComponent(orderCode)}/status`, { signal }).then((r) => r.data),
};
