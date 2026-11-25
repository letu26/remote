import { describe, expect, it, vi } from "vitest";

const post = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { analysis: "ok", message: null } }));
vi.mock("./http", () => ({ http: { post, get: vi.fn() } }));

import { adminStatsService } from "./admin-stats.service";

describe("adminStatsService.analysis", () => {
  it("gửi thân là object rỗng: backend từ chối thân `null`", async () => {
    const range = { from: "2026-11-01", to: "2026-11-25" };
    await adminStatsService.analysis(range);
    expect(post).toHaveBeenCalledWith("/admin/stats/analysis", {}, expect.objectContaining({ params: range }));
  });
});
