/** Các dòng giỏ đã chọn để thanh toán, giữ ở sessionStorage (mất thì /checkout quay về /cart). */
const KEY = "checkout.itemIds";
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function subscribeCheckout(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Chuỗi JSON thô (ổn định giữa các lần đọc) để dùng với useSyncExternalStore. */
export function getCheckoutRaw(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function parseCheckoutIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    const ids = v.filter((x): x is number => Number.isInteger(x) && x > 0);
    return [...new Set(ids)].slice(0, 50);
  } catch {
    return [];
  }
}

export function setCheckoutItems(ids: number[]) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage có thể bị chặn */
  }
  emit();
}

export function clearCheckout() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}
