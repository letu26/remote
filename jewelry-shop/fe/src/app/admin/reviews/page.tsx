import { Suspense } from "react";
import { ReviewList } from "@/components/admin/review/ReviewList";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Đánh giá" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Đánh giá">
        <Suspense fallback={null}>
          <ReviewList />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
