import { Suspense } from "react";
import { CustomerList } from "@/components/admin/customer/CustomerList";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Người dùng" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Người dùng">
        <Suspense fallback={null}>
          <CustomerList />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
