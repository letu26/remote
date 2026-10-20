import { Suspense } from "react";
import { OrderDetailView } from "@/components/admin/order/OrderPages";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Chi tiết đơn hàng" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Chi tiết đơn hàng">
        <Suspense fallback={null}>
          <OrderDetailView />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
