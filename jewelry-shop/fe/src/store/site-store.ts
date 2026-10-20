"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cmsService } from "@/services/cms.service";
import type { SiteInfo } from "@/types/cms";
import { FALLBACK_SITE_INFO, mergeSiteInfo, normalizeMenu, type NavNode } from "@/utils/cms";

/**
 * Thông tin cửa hàng và menu: tải MỘT lần cho cả phiên và dùng chung (header, footer, chatbot...).
 * Luôn có giá trị dự phòng nên giao diện không bao giờ trống khi API lỗi.
 */
interface SiteState {
  info: SiteInfo;
  header: NavNode[];
  footer: NavNode[];
}

const INITIAL: SiteState = { info: FALLBACK_SITE_INFO, header: [], footer: [] };
let state: SiteState = INITIAL;
let started = false;
const listeners = new Set<() => void>();

function set(next: Partial<SiteState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Gọi nhiều lần vẫn chỉ tải một lần. Mỗi nguồn lỗi độc lập, giữ dự phòng. */
export function loadSite(): void {
  if (started) return;
  started = true;
  cmsService.siteInfo().then((d) => set({ info: mergeSiteInfo(d) })).catch(() => {});
  cmsService.menus("header").then((d) => set({ header: normalizeMenu(d) })).catch(() => {});
  cmsService.menus("footer").then((d) => set({ footer: normalizeMenu(d) })).catch(() => {});
}

/** Chỉ dùng trong test. */
export function resetSiteStore() {
  started = false;
  state = INITIAL;
  listeners.forEach((l) => l());
}

function useSite(): SiteState {
  useEffect(() => {
    loadSite();
  }, []);
  return useSyncExternalStore(subscribe, () => state, () => INITIAL);
}

export const useSiteInfo = () => useSite().info;
/** Rỗng nghĩa là chưa có menu từ API: nơi dùng áp dụng dự phòng. */
export const useHeaderMenu = () => useSite().header;
export const useFooterMenu = () => useSite().footer;
