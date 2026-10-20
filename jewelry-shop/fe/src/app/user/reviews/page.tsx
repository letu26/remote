import { MyReviewsView } from "@/components/user/MyReviewsView";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Đánh giá của tôi" };

export default function MyReviewsPage() {
  return (
    <RouteGuard>
      <DashboardLayout variant="account" title="Đánh giá của tôi">
        <MyReviewsView />
      </DashboardLayout>
    </RouteGuard>
  );
}
