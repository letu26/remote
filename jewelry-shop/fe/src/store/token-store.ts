import { TOKEN_KEY } from "@/constants";

// Token lưu ở sessionStorage: mỗi tab đăng nhập riêng, đóng tab là mất phiên.
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
  emit();
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function subscribeToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
