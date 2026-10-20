import { GemstonesView } from "@/components/admin/CatalogViews";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Loại đá" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Loại đá">
        <GemstonesView />
      </DashboardLayout>
    </RouteGuard>
  );
}
