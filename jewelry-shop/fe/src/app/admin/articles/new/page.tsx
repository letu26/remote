import { ArticleCreateView } from "@/components/admin/cms/ArticlePages";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Thêm bài viết" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Thêm bài viết">
        <ArticleCreateView />
      </DashboardLayout>
    </RouteGuard>
  );
}
