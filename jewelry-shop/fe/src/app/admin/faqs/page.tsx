import { FaqsView } from "@/components/admin/cms/CmsViews";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Hỏi đáp" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Hỏi đáp">
        <FaqsView />
      </DashboardLayout>
    </RouteGuard>
  );
}
