export type NotifyKind = "error" | "success" | "warning" | "info";
export interface Notice {
  id: number;
  kind: NotifyKind;
  message: string;
}

type Listener = (n: Notice) => void;
const listeners = new Set<Listener>();
let seq = 0;

export function notify(kind: NotifyKind, message: string) {
  const n = { id: ++seq, kind, message };
  listeners.forEach((l) => l(n));
}

export function subscribeNotice(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
