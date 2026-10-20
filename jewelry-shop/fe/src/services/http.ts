import axios, { AxiosError, isCancel } from "axios";
import { ERROR_MESSAGES, ROUTES } from "@/constants";
import { clearToken, getToken } from "@/store/token-store";
import { ApiError, type ApiErrorDetail } from "@/utils/errors";
import { setFlash } from "@/utils/flash";
import { notify } from "@/utils/notify";

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/** Các endpoint xác thực: 401/403 ở đây là lỗi nghiệp vụ của form, không phải hết phiên. */
const isAuthEndpoint = (url?: string) => !!url && url.startsWith("/auth/");

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

let redirecting = false;

function redirectTo(path: string) {
  if (typeof window === "undefined" || redirecting) return;
  if (window.location.pathname === path) return;
  redirecting = true;
  window.location.assign(path);
}

interface ErrorBody {
  code?: string;
  message?: string | string[];
  details?: ApiErrorDetail[];
  retryAfterSeconds?: number;
  remainingAttempts?: number;
  available?: number;
  inCart?: number;
  shortages?: unknown;
  total?: number;
  subtotal?: number;
  shippingFee?: number;
}

/** Điểm DUY NHẤT chuẩn hóa lỗi và xử lý lỗi toàn cục (401/403/mạng/500). */
http.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ErrorBody>) => {
    const { response, config, code: axCode } = error;

    // Request bị chủ động hủy (AbortController): không phải lỗi mạng, không báo người dùng.
    if (isCancel(error)) return Promise.reject(error);

    if (!response) {
      const timeout = axCode === "ECONNABORTED" || axCode === "ETIMEDOUT";
      const key = timeout ? "TIMEOUT" : "NETWORK_ERROR";
      notify("error", ERROR_MESSAGES[key]);
      return Promise.reject(new ApiError(0, key, ERROR_MESSAGES[key]));
    }

    const { status, data } = response;
    const code = data?.code ?? (status >= 500 ? "INTERNAL_ERROR" : "UNKNOWN");
    const rawMessage = Array.isArray(data?.message) ? data?.message[0] : data?.message;
    const message = rawMessage || ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
    const apiError = new ApiError(status, code, message, data?.details ?? [], data?.retryAfterSeconds, data?.remainingAttempts, {
      available: data?.available,
      inCart: data?.inCart,
      shortages: data?.shortages,
      total: data?.total,
      subtotal: data?.subtotal,
      shippingFee: data?.shippingFee,
    });
    const authCall = isAuthEndpoint(config?.url);

    if (status === 401 && !authCall) {
      clearToken();
      if (typeof window !== "undefined" && window.location.pathname !== ROUTES.login) {
        // Chuyển trang tải lại toàn bộ nên toast sẽ mất: lưu thông báo để trang login hiển thị.
        setFlash("error", code === "TOKEN_REVOKED" ? ERROR_MESSAGES.TOKEN_REVOKED : message);
        redirectTo(ROUTES.login);
      }
    } else if (status === 403 && !authCall && code === "ACCOUNT_LOCKED") {
      clearToken();
      if (typeof window !== "undefined" && window.location.pathname !== ROUTES.login) {
        setFlash("error", ERROR_MESSAGES.ACCOUNT_LOCKED);
        redirectTo(ROUTES.login);
      }
    } else if (status === 403 && !authCall && code === "FORBIDDEN") {
      redirectTo(ROUTES.unauthorized);
    } else if (status >= 500) {
      notify("error", message);
    }

    return Promise.reject(apiError);
  },
);
