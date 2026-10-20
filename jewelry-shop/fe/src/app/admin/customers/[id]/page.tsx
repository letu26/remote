import { Suspense } from "react";
import { CustomerDetailView } from "@/components/admin/customer/CustomerPages";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Chi tiết khách hàng" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Chi tiết khách hàng">
        <Suspense fallback={null}>
          <CustomerDetailView />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
