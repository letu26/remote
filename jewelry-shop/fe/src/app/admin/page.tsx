import { Suspense } from "react";
import { Dashboard } from "@/components/admin/dashboard/Dashboard";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Bảng điều khiển quản trị" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Bảng điều khiển quản trị">
        <Suspense fallback={null}>
          <Dashboard />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
