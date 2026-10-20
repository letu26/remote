import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/utils/errors";

const svc = vi.hoisted(() => ({ ids: vi.fn(), add: vi.fn(), remove: vi.fn() }));
vi.mock("@/services/wishlist.service", () => ({ wishlistService: svc }));

import { clearToken, setToken } from "./token-store";
import { getWishlistIds, loadWishlistIds, resetWishlist, toggleWishlist } from "./wishlist-store";

beforeEach(() => {
  sessionStorage.clear();
  setToken("tok");
  Object.values(svc).forEach((f) => f.mockReset());
  resetWishlist();
});

describe("wishlist-store", () => {
  it("tải ids một lần", async () => {
    svc.ids.mockResolvedValue([1, 5]);
    await loadWishlistIds();
    await loadWishlistIds();
    expect(svc.ids).toHaveBeenCalledTimes(1);
    expect([...getWishlistIds()]).toEqual([1, 5]);
  });
  it("thêm: đổi ngay trước khi API trả về", async () => {
    let resolve!: () => void;
    svc.add.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    const p = toggleWishlist(7);
    expect(getWishlistIds().has(7)).toBe(true);
    resolve();
    await expect(p).resolves.toBe(true);
  });
  it("thêm lỗi: hoàn lại và ném lỗi", async () => {
    svc.add.mockRejectedValue(new ApiError(404, "NOT_FOUND", "x"));
    await expect(toggleWishlist(7)).rejects.toBeTruthy();
    expect(getWishlistIds().has(7)).toBe(false);
  });
  it("bỏ: lỗi thì tim được hoàn lại", async () => {
    svc.ids.mockResolvedValue([3]);
    await loadWishlistIds();
    svc.remove.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "x"));
    await expect(toggleWishlist(3)).rejects.toBeTruthy();
    expect(getWishlistIds().has(3)).toBe(true);
  });
  it("bấm đúp khi đang chờ chỉ gửi một request", async () => {
    let resolve!: () => void;
    svc.add.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    const first = toggleWishlist(9);
    expect(await toggleWishlist(9)).toBeNull();
    resolve();
    await first;
    expect(svc.add).toHaveBeenCalledTimes(1);
  });
  it("xóa sạch khi đăng xuất", async () => {
    svc.ids.mockResolvedValue([1]);
    await loadWishlistIds();
    clearToken();
    expect(getWishlistIds().size).toBe(0);
  });
});
