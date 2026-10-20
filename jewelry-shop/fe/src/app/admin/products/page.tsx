import { ProductList } from "@/components/admin/product/ProductList";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Sản phẩm" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Sản phẩm">
        <ProductList />
      </DashboardLayout>
    </RouteGuard>
  );
}
