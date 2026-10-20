import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { GuestGuard } from "@/guards/RouteGuard";
import { AuthLayout } from "@/layouts/AuthLayout";

export const metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <AuthLayout
        title="Quên mật khẩu"
        subtitle="Nhập email tài khoản để nhận mã OTP đặt lại mật khẩu."
        footer={<Link href="/login" className="font-medium text-gold-deep hover:underline">Quay lại đăng nhập</Link>}
      >
        <ForgotPasswordForm />
      </AuthLayout>
    </GuestGuard>
  );
}
