import { SettingsTabs } from "@/components/admin/settings/SettingsTabs";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Cài đặt" };

export default function Page() {
  return (
    <RouteGuard roles={["admin"]}>
      <DashboardLayout variant="admin" title="Cài đặt">
        <SettingsTabs />
      </DashboardLayout>
    </RouteGuard>
  );
}
