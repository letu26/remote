import { CategoriesView } from "@/components/admin/CatalogViews";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Danh mục" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Danh mục">
        <CategoriesView />
      </DashboardLayout>
    </RouteGuard>
  );
}
