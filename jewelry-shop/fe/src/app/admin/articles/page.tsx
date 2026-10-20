import { Suspense } from "react";
import { ArticleList } from "@/components/admin/cms/ArticleList";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Bài viết" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Bài viết">
        <Suspense fallback={null}>
          <ArticleList />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
