import { WishlistView } from "@/components/user/WishlistView";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Yêu thích" };

export default function WishlistPage() {
  return (
    <RouteGuard>
      <DashboardLayout variant="account" title="Sản phẩm yêu thích">
        <WishlistView />
      </DashboardLayout>
    </RouteGuard>
  );
}
