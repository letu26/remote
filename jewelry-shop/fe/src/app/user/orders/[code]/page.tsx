import { Suspense } from "react";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Chi tiết đơn hàng" };

export default function OrderDetailPage() {
  return (
    <RouteGuard>
      <DashboardLayout variant="account" title="Chi tiết đơn hàng">
        <Suspense fallback={null}>
          <OrderDetailView />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
