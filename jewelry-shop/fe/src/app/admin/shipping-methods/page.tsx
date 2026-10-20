import { ShippingView } from "@/components/admin/ShippingView";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Phương thức vận chuyển" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Phương thức vận chuyển">
        <ShippingView />
      </DashboardLayout>
    </RouteGuard>
  );
}
