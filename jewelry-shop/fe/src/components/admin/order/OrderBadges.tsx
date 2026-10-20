import type { OrderStatus, PaymentStatus } from "@/types/admin-order";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "./order-meta";

const base = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`${base} ${ORDER_STATUS_TONE[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`${base} ${PAYMENT_STATUS_TONE[status]}`}>{PAYMENT_STATUS_LABEL[status]}</span>;
}
