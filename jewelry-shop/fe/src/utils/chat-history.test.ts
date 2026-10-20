import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHAT_HISTORY_KEY, CHAT_MAX_MESSAGES, clearHistory, loadHistory, saveHistory, type ChatMessage } from "./chat-history";

const msg = (id: number): ChatMessage => ({ id, role: id % 2 ? "user" : "bot", text: `t${id}` });
beforeEach(() => sessionStorage.clear());

describe("chat-history", () => {
  it("lưu và đọc lại", () => {
    saveHistory([msg(1), msg(2)]);
    expect(loadHistory()).toEqual([msg(1), msg(2)]);
  });
  it("giới hạn số tin khi lưu và khi đọc", () => {
    saveHistory(Array.from({ length: CHAT_MAX_MESSAGES + 10 }, (_, i) => msg(i + 1)));
    const h = loadHistory();
    expect(h).toHaveLength(CHAT_MAX_MESSAGES);
    expect(h[h.length - 1].id).toBe(CHAT_MAX_MESSAGES + 10);
  });
  it("dữ liệu hỏng hoặc sai dạng thì rỗng / bỏ phần tử sai", () => {
    sessionStorage.setItem(CHAT_HISTORY_KEY, "không phải json");
    expect(loadHistory()).toEqual([]);
    sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify([msg(1), { id: "x" }, null, { id: 2, role: "bot" }]));
    expect(loadHistory()).toEqual([msg(1)]);
  });
  it("xóa lịch sử", () => {
    saveHistory([msg(1)]);
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });
  it("storage bị chặn không ném lỗi", () => {
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(loadHistory()).toEqual([]);
    expect(() => saveHistory([msg(1)])).not.toThrow();
    expect(() => clearHistory()).not.toThrow();
    get.mockRestore();
    set.mockRestore();
  });
});
