"use client";

import { useParams } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { OrderDetail } from "./OrderDetail";
import { OrderInvoice } from "./OrderInvoice";

function useOrderId(): number | null {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const invalid = <ErrorState title="Đơn hàng không tồn tại" description="Đường dẫn không hợp lệ." />;

export function OrderDetailView() {
  const id = useOrderId();
  return id === null ? invalid : <OrderDetail key={id} orderId={id} />;
}
export function OrderInvoiceView() {
  const id = useOrderId();
  return id === null ? invalid : <OrderInvoice key={id} orderId={id} />;
}
