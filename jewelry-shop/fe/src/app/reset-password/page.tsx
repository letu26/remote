import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { GuestGuard } from "@/guards/RouteGuard";
import { AuthLayout } from "@/layouts/AuthLayout";

export const metadata = { title: "Đặt lại mật khẩu" };

export default function ResetPasswordPage() {
  return (
    <GuestGuard>
      <AuthLayout
        title="Đặt lại mật khẩu"
        subtitle="Nhập mật khẩu mới cho tài khoản của bạn."
        footer={<Link href="/login" className="font-medium text-gold-deep hover:underline">Quay lại đăng nhập</Link>}
      >
        <ResetPasswordForm />
      </AuthLayout>
    </GuestGuard>
  );
}
