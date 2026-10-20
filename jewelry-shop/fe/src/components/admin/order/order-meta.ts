import type { AdminOrderDetail, AdminOrderQuery, OrderStatus, PaymentMethod, PaymentStatus } from "@/types/admin-order";

/** Nhãn trạng thái thống nhất (admin). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị hàng",
  shipping: "Đang giao hàng",
  delivered: "Giao hàng thành công",
  cancelled: "Đã hủy",
};
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
};
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];
export const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[];

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-gold-tint text-gold-deeper border border-gold/50",
  confirmed: "bg-sand text-ink border border-line-strong",
  preparing: "bg-sand text-ink border border-line-strong",
  shipping: "bg-gold/25 text-gold-deeper border border-gold/60",
  delivered: "bg-success/10 text-success border border-success/30",
  cancelled: "bg-sale/10 text-sale border border-sale/30",
};
export const PAYMENT_STATUS_TONE: Record<PaymentStatus, string> = {
  unpaid: "bg-sand text-muted border border-line-strong",
  paid: "bg-success/10 text-success border border-success/30",
};

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "shipping",
  shipping: "delivered",
};
export const NEXT_STATUS_ACTION: Record<string, string> = {
  confirmed: "Xác nhận đơn",
  preparing: "Chuẩn bị hàng",
  shipping: "Giao hàng",
  delivered: "Hoàn tất giao hàng",
};

/** Bước kế tiếp hợp lệ (không nhảy cóc, không đi lùi). */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  return NEXT[status] ?? null;
}
/** Admin hủy được khi pending, confirmed, preparing. */
export function canCancel(status: OrderStatus): boolean {
  return status === "pending" || status === "confirmed" || status === "preparing";
}
/** Chỉ đơn chuyển khoản chưa hủy mới đổi được trạng thái thanh toán. */
export function canChangePayment(order: Pick<AdminOrderDetail, "paymentMethod" | "status">): boolean {
  return order.paymentMethod === "bank_transfer" && order.status !== "cancelled";
}

// ---------- Bộ lọc <-> URL ----------

export interface OrderFilters {
  q: string;
  status: OrderStatus | "";
  paymentStatus: PaymentStatus | "";
  from: string;
  to: string;
  userId: string;
  page: number;
}
export const EMPTY_FILTERS: OrderFilters = { q: "", status: "", paymentStatus: "", from: "", to: "", userId: "", page: 1 };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseOrderFilters(params: URLSearchParams): OrderFilters {
  const status = params.get("status") ?? "";
  const pay = params.get("paymentStatus") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const page = Number(params.get("page"));
  const userId = params.get("userId") ?? "";
  return {
    q: params.get("q") ?? "",
    status: (ORDER_STATUSES as string[]).includes(status) ? (status as OrderStatus) : "",
    paymentStatus: (PAYMENT_STATUSES as string[]).includes(pay) ? (pay as PaymentStatus) : "",
    from: DATE.test(from) ? from : "",
    to: DATE.test(to) ? to : "",
    userId: /^\d+$/.test(userId) && Number(userId) > 0 ? userId : "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export function buildOrderSearch(f: OrderFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.status) p.set("status", f.status);
  if (f.paymentStatus) p.set("paymentStatus", f.paymentStatus);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.userId) p.set("userId", f.userId);
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function filtersToQuery(f: OrderFilters, pageSize: number): AdminOrderQuery {
  return {
    page: f.page,
    pageSize,
    q: f.q.trim() || undefined,
    status: f.status || undefined,
    paymentStatus: f.paymentStatus || undefined,
    from: f.from || undefined,
    to: f.to || undefined,
    userId: f.userId ? Number(f.userId) : undefined,
  };
}

/** "2026-10-17T03:00:00Z" -> "17/10/2026 10:00" (giờ Việt Nam). */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
