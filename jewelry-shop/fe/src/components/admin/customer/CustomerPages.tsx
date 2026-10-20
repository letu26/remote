"use client";

import { useParams } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { CustomerDetail } from "./CustomerDetail";

export function CustomerDetailView() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return <ErrorState title="Khách hàng không tồn tại" description="Đường dẫn không hợp lệ." />;
  return <CustomerDetail key={id} customerId={id} />;
}
