import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { GuestGuard } from "@/guards/RouteGuard";
import { AuthLayout } from "@/layouts/AuthLayout";

export const metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <GuestGuard>
      <AuthLayout
        title="Đăng nhập"
        subtitle="Chào mừng bạn trở lại."
        footer={<>Chưa có tài khoản? <Link href="/register" className="font-medium text-gold-deep hover:underline">Đăng ký</Link></>}
      >
        <LoginForm />
      </AuthLayout>
    </GuestGuard>
  );
}
