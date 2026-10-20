import { MaterialsView } from "@/components/admin/CatalogViews";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Chất liệu" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Chất liệu">
        <MaterialsView />
      </DashboardLayout>
    </RouteGuard>
  );
}
