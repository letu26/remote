import { CollectionsView } from "@/components/admin/CatalogViews";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Bộ sưu tập" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Bộ sưu tập">
        <CollectionsView />
      </DashboardLayout>
    </RouteGuard>
  );
}
