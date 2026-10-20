import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GuestGuard } from "@/guards/RouteGuard";
import { AuthLayout } from "@/layouts/AuthLayout";

export const metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <GuestGuard>
      <AuthLayout
        title="Tạo tài khoản"
        subtitle="Đăng ký để khám phá bộ sưu tập trang sức đá quý."
        footer={<>Đã có tài khoản? <Link href="/login" className="font-medium text-gold-deep hover:underline">Đăng nhập</Link></>}
      >
        <RegisterForm />
      </AuthLayout>
    </GuestGuard>
  );
}
