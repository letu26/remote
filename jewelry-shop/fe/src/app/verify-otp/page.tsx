import Link from "next/link";
import { VerifyOtpForm } from "@/components/auth/VerifyOtpForm";
import { GuestGuard } from "@/guards/RouteGuard";
import { AuthLayout } from "@/layouts/AuthLayout";

export const metadata = { title: "Xác thực OTP" };

export default function VerifyOtpPage() {
  return (
    <GuestGuard>
      <AuthLayout
        title="Xác thực OTP"
        subtitle="Nhập mã gồm 6 chữ số được gửi tới email của bạn."
        footer={<Link href="/forgot-password" className="font-medium text-gold-deep hover:underline">Dùng email khác</Link>}
      >
        <VerifyOtpForm />
      </AuthLayout>
    </GuestGuard>
  );
}
