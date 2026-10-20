import type { Role } from "@/constants";

export interface JwtPayload {
  id: number;
  email: string;
  role: Role;
  exp: number;
  iat?: number;
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Giải mã payload JWT (không xác thực chữ ký). Trả về null nếu token sai định dạng. */
export function decodeJwt(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const raw = JSON.parse(base64UrlDecode(parts[1]));
    const id = Number(raw.id ?? raw.sub);
    if (
      !Number.isFinite(id) ||
      typeof raw.email !== "string" ||
      (raw.role !== "admin" && raw.role !== "user") ||
      typeof raw.exp !== "number"
    ) {
      return null;
    }
    return { id, email: raw.email, role: raw.role, exp: raw.exp, iat: raw.iat };
  } catch {
    return null;
  }
}

/** exp tính bằng giây (chuẩn JWT). */
export function isTokenExpired(
  payload: Pick<JwtPayload, "exp">,
  nowMs: number = Date.now(),
): boolean {
  return payload.exp * 1000 <= nowMs;
}

/** Trả về payload nếu token hợp lệ và chưa hết hạn, ngược lại null. */
export function getValidPayload(
  token: string | null | undefined,
  nowMs?: number,
): JwtPayload | null {
  const payload = decodeJwt(token);
  // Chỉ đọc đồng hồ khi thực sự có token (tránh Date.now() lúc prerender).
  if (!payload || isTokenExpired(payload, nowMs ?? Date.now())) return null;
  return payload;
}
