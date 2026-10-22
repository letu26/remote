import { WishlistView } from "@/components/user/WishlistView";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Sản phẩm yêu thích" };

export default function WishlistPage() {
  return (
    <RouteGuard>
      <DashboardLayout variant="account" title="Sản phẩm yêu thích" bare>
        <WishlistView />
      </DashboardLayout>
    </RouteGuard>
  );
}
