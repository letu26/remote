import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { AuthLayout } from "@/layouts/AuthLayout";

export const metadata = { title: "Không có quyền truy cập" };

export default function UnauthorizedPage() {
  return (
    <AuthLayout title="Không có quyền truy cập" subtitle="Bạn không có quyền xem trang này.">
      <div className="flex flex-col gap-3 text-center text-sm">
        <ButtonLink href="/">Về trang chủ</ButtonLink>
        <Link href="/login" className="font-medium text-gold-deep hover:underline">Đăng nhập tài khoản khác</Link>
      </div>
    </AuthLayout>
  );
}
