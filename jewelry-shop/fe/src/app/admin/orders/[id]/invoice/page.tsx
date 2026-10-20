import { Suspense } from "react";
import { OrderInvoiceView } from "@/components/admin/order/OrderPages";
import { RouteGuard } from "@/guards/RouteGuard";

export const metadata = { title: "Hóa đơn" };

// Không dùng DashboardLayout: trang in không có điều hướng.
export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <Suspense fallback={null}>
        <OrderInvoiceView />
      </Suspense>
    </RouteGuard>
  );
}
