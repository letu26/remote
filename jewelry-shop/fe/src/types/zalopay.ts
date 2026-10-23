/** Thanh toán ZaloPay (be: modules/zalopay). */

export interface ZaloPayPayment {
  appTransId: string;
  /** Địa chỉ dùng để dựng mã QR; mở trực tiếp trên điện thoại cũng được. */
  orderUrl: string;
  amount: number;
  /** ISO 8601; mã hết hạn sau 15 phút. */
  expiresAt: string;
}

export type ZaloPayStatus =
  | { status: "paid" }
  | { status: "none" }
  | { status: "expired" }
  | { status: "pending"; expiresAt: string };
