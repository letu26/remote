import { AddressesView } from "@/components/user/AddressesView";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Sổ địa chỉ" };

export default function AddressesPage() {
  return (
    <RouteGuard>
      <DashboardLayout variant="account" title="Sổ địa chỉ">
        <AddressesView />
      </DashboardLayout>
    </RouteGuard>
  );
}
