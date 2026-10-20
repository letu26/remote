import { PagesView } from "@/components/admin/cms/CmsViews";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Trang nội dung" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Trang nội dung">
        <PagesView />
      </DashboardLayout>
    </RouteGuard>
  );
}
