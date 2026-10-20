"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { ROUTES } from "@/constants";
import { authService } from "@/services/auth.service";
import { clearToken, getToken } from "@/store/token-store";

/** Gọi API đăng xuất rồi xóa token cục bộ. Dù API lỗi vẫn xóa token và chuyển /login. */
export function LogoutRunner() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // React strict mode chạy effect hai lần
    started.current = true;
    (async () => {
      try {
        if (getToken()) await authService.logout();
      } catch {
        /* token có thể đã bị thu hồi hoặc mất mạng: vẫn đăng xuất cục bộ */
      } finally {
        clearToken();
        router.replace(ROUTES.login);
      }
    })();
  }, [router]);

  return <Spinner fullScreen label="Đang đăng xuất..." />;
}
