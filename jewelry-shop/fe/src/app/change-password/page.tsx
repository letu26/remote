import { ChangePasswordView } from "@/components/user/ChangePasswordView";
import { RouteGuard } from "@/guards/RouteGuard";

export const metadata = { title: "Đổi mật khẩu" };

export default function ChangePasswordPage() {
  return (
    <RouteGuard>
      <ChangePasswordView />
    </RouteGuard>
  );
}
