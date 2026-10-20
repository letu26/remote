import { BannersView } from "@/components/admin/cms/CmsViews";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Banner" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Banner">
        <BannersView />
      </DashboardLayout>
    </RouteGuard>
  );
}
