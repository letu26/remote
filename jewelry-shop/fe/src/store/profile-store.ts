"use client";

import { useSyncExternalStore } from "react";
import { userService, type Profile } from "@/services/user.service";
import { getToken, subscribeToken } from "./token-store";

/** Họ tên của người đang đăng nhập (GET /users/me, tải một lần khi đăng nhập) để chào ở header. */
let fullName = "";
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Tên gọi theo cách người Việt: từ cuối của họ tên ("Lê Văn Tú" -> "Tú"). */
export function givenName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words[words.length - 1] ?? "";
}

export const useGivenName = () => useSyncExternalStore(subscribe, () => givenName(fullName), () => "");

export async function loadProfileName() {
  if (!getToken() || loaded) return;
  try {
    const profile = await userService.getMe();
    if (!getToken()) return;
    loaded = true;
    fullName = profile.fullName;
    emit();
  } catch {
    /* lỗi đã được interceptor xử lý; header giữ nhãn mặc định */
  }
}

/** Khi người dùng vừa lưu hồ sơ: cập nhật lời chào ngay. */
export function syncProfileName(profile: Pick<Profile, "fullName">) {
  fullName = profile.fullName;
  loaded = true;
  emit();
}

export function resetProfileName() {
  loaded = false;
  fullName = "";
  emit();
}

if (typeof window !== "undefined") {
  subscribeToken(() => {
    if (!getToken()) resetProfileName();
  });
}
