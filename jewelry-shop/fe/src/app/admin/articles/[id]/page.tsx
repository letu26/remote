import { Suspense } from "react";
import { ArticleEditView } from "@/components/admin/cms/ArticlePages";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Sửa bài viết" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Sửa bài viết">
        <Suspense fallback={null}>
          <ArticleEditView />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
