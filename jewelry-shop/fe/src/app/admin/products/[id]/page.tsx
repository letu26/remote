import { Suspense } from "react";
import { ProductEditView } from "@/components/admin/product/ProductPages";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Sửa sản phẩm" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Sửa sản phẩm">
        <Suspense fallback={null}>
          <ProductEditView />
        </Suspense>
      </DashboardLayout>
    </RouteGuard>
  );
}
