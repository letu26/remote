import { Suspense } from "react";
import { OrderList } from "@/components/admin/order/OrderList";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Đơn hàng" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Đơn hàng">
        <Suspense fallback={null}>
          <OrderList />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
