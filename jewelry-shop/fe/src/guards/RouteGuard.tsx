"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ROUTES, type Role } from "@/constants";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/store/auth-context";
import { currentPath, loginUrl, redirectTarget } from "@/utils/redirect";

interface Props {
  /** Bỏ trống = chỉ cần đăng nhập. */
  roles?: Role[];
  children: ReactNode;
}

/** Bảo vệ route private. Chỉ render children khi đã xác thực và đúng role (tránh nhấp nháy). */
export function RouteGuard({ roles, children }: Props) {
  const { status, role } = useAuth();
  const router = useRouter();
  const allowed = status === "authenticated" && (!roles || (role !== null && roles.includes(role)));

  useEffect(() => {
    if (status === "unauthenticated") router.replace(loginUrl(currentPath()));
    else if (status === "authenticated" && !allowed) router.replace(ROUTES.unauthorized);
  }, [status, allowed, router]);

  if (!allowed) return <Spinner fullScreen label="Đang kiểm tra quyền truy cập..." />;
  return <>{children}</>;
}

/** Trang khách (login/register...): đã đăng nhập thì chuyển về trang theo role. */
export function GuestGuard({ children }: { children: ReactNode }) {
  const { status, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && role) router.replace(redirectTarget(role === "admin" ? ROUTES.admin : ROUTES.user));
  }, [status, role, router]);

  if (status !== "unauthenticated") return <Spinner fullScreen />;
  return <>{children}</>;
}
