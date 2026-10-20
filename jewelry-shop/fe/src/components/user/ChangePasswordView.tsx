"use client";

import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useAuth } from "@/store/auth-context";
import { ChangePasswordForm } from "./ChangePasswordForm";

/** Trang đổi mật khẩu dùng chung cho mọi role: khung theo role đang đăng nhập. */
export function ChangePasswordView() {
  const { role } = useAuth();
  return (
    <DashboardLayout variant={role === "admin" ? "admin" : "account"} title="Đổi mật khẩu">
      <section className="max-w-lg rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5">
        <p className="mb-5 text-sm text-muted">
          Sau khi đổi mật khẩu, mọi thiết bị sẽ bị đăng xuất và bạn cần đăng nhập lại.
        </p>
        <ChangePasswordForm />
      </section>
    </DashboardLayout>
  );
}
