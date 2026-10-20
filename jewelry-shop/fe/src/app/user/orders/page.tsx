import { OrdersView } from "@/components/orders/OrdersView";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Đơn hàng của tôi" };

export default function OrdersPage() {
  return (
    <RouteGuard>
      <DashboardLayout variant="account" title="Đơn hàng của tôi">
        <OrdersView />
      </DashboardLayout>
    </RouteGuard>
  );
}
