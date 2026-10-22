import { Suspense } from "react";
import { CustomerDetailView } from "@/components/admin/customer/CustomerPages";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Chi tiết người dùng" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Chi tiết người dùng">
        <Suspense fallback={null}>
          <CustomerDetailView />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
