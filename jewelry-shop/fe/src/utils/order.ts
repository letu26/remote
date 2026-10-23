import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị hàng",
  shipping: "Đang giao hàng",
  delivered: "Giao hàng thành công",
  cancelled: "Đã hủy",
};

export const ORDER_STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "preparing", "shipping", "delivered", "cancelled"];

/** Tông màu của Badge theo trạng thái. */
export const ORDER_STATUS_TONE: Record<OrderStatus, "gold" | "success" | "neutral" | "sale"> = {
  pending: "gold",
  confirmed: "gold",
  preparing: "gold",
  shipping: "gold",
  delivered: "success",
  cancelled: "sale",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  zalopay: "Quét mã QR ZaloPay",
};

export const orderStatusLabel = (s: string) => ORDER_STATUS_LABEL[s as OrderStatus] ?? s;
