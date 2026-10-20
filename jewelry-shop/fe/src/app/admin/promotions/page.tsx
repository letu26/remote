import { Suspense } from "react";
import { PromotionList } from "@/components/admin/promotion/PromotionList";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Khuyến mại" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Khuyến mại">
        <Suspense fallback={null}>
          <PromotionList />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
