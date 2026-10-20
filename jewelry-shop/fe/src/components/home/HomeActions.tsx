"use client";

import { ButtonLink } from "@/components/ui/Button";
import { ROLE_HOME, ROUTES } from "@/constants";
import { useAuth } from "@/store/auth-context";

/** Nút đăng nhập/đăng ký hoặc vào khu vực theo role. */
export function HomeActions() {
  const { status, role } = useAuth();

  if (status === "loading") return <div className="h-11" aria-hidden />;
  if (status === "authenticated" && role) {
    return (
      <ButtonLink href={ROLE_HOME[role]} variant="secondary" size="lg">
        {role === "admin" ? "Vào khu vực quản trị" : "Vào tài khoản của tôi"}
      </ButtonLink>
    );
  }
  return (
    <>
      <ButtonLink href={ROUTES.login} variant="secondary" size="lg">
        Đăng nhập
      </ButtonLink>
      <ButtonLink href={ROUTES.register} variant="ghost" size="lg">
        Đăng ký
      </ButtonLink>
    </>
  );
}
