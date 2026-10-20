"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuth } from "@/store/auth-context";
import { notify } from "@/utils/notify";
import { currentPath, loginUrl } from "@/utils/redirect";

/**
 * Trả về hàm kiểm tra đăng nhập cho các thao tác cần tài khoản (giỏ hàng, yêu thích).
 * Chưa đăng nhập: báo toast rồi chuyển `/login?redirect=<trang hiện tại>` và trả về false.
 */
export function useRequireLogin() {
  const { status } = useAuth();
  const router = useRouter();
  return useCallback((): boolean => {
    if (status === "authenticated") return true;
    notify("info", "Vui lòng đăng nhập để tiếp tục");
    router.push(loginUrl(currentPath()));
    return false;
  }, [status, router]);
}
