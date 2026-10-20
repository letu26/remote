import { ProductCreateView } from "@/components/admin/product/ProductPages";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Thêm sản phẩm" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Thêm sản phẩm">
        <ProductCreateView />
      </DashboardLayout>
    </RouteGuard>
  );
}
