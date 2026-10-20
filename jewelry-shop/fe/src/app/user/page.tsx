import { AccountPanel } from "@/components/user/AccountPanel";
import { RouteGuard } from "@/guards/RouteGuard";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const metadata = { title: "Tài khoản" };

export default function UserPage() {
  return (
    <RouteGuard roles={["user"]}>
      <DashboardLayout variant="account" title="Tài khoản của tôi">
        <AccountPanel />
      </DashboardLayout>
    </RouteGuard>
  );
}
