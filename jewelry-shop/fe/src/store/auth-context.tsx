"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ROLE_HOME, ROUTES, type Role } from "@/constants";
import { authService } from "@/services/auth.service";
import { getValidPayload, type JwtPayload } from "@/utils/jwt";
import { clearToken, getToken, setToken, subscribeToken } from "./token-store";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: JwtPayload | null;
  role: Role | null;
  /** Đăng nhập, trả về đường dẫn trang chủ theo role. */
  login: (phone: string, password: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const noopSubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(noopSubscribe, () => true, () => false);

export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const token = useSyncExternalStore(subscribeToken, getToken, () => null);
  const user = useMemo(() => getValidPayload(token), [token]);

  // Token sai/hết hạn nằm trong storage: xóa để không giữ session cũ.
  useEffect(() => {
    if (hydrated && token && !user) clearToken();
  }, [hydrated, token, user]);

  // Tự đăng xuất đúng lúc token hết hạn.
  useEffect(() => {
    if (!user) return;
    const ms = user.exp * 1000 - Date.now();
    const timer = setTimeout(clearToken, Math.min(Math.max(ms, 0), 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [user]);

  const login = useCallback(async (phone: string, password: string) => {
    const { accessToken } = await authService.login(phone, password);
    const payload = getValidPayload(accessToken);
    if (!payload) throw new Error("Token không hợp lệ");
    setToken(accessToken);
    return ROLE_HOME[payload.role] ?? ROUTES.home;
  }, []);

  const logout = useCallback(() => clearToken(), []);

  const status: AuthStatus = !hydrated ? "loading" : user ? "authenticated" : "unauthenticated";

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, role: user?.role ?? null, login, logout }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong AuthProvider");
  return ctx;
}
