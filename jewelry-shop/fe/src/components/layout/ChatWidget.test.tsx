import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/utils/errors";

const m = vi.hoisted(() => ({ suggestions: vi.fn(), ask: vi.fn(), notify: vi.fn() }));
vi.mock("@/services/chatbot.service", () => ({
  chatbotService: { suggestions: () => m.suggestions(), ask: (...a: unknown[]) => m.ask(...a) },
}));
vi.mock("@/services/cms.service", () => ({ cmsService: { siteInfo: vi.fn().mockResolvedValue({}), menus: vi.fn().mockResolvedValue([]) } }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));

import { CHAT_HISTORY_KEY } from "@/utils/chat-history";
import { ChatWidget } from "./ChatWidget";

const intro = { greeting: "Chào bạn, mình hỗ trợ gì?", suggestions: [{ id: 1, question: "Giờ mở cửa?" }, { id: 2, question: "Bảo hành thế nào?" }] };
const answer = (text = "Mở cửa 8h-21h", over = {}) => ({
  answer: text, matched: { id: 1, question: "Giờ mở cửa?" }, suggestions: [{ id: 3, question: "Đổi trả?" }], fallback: false, ...over,
});

const openChat = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Mở chat tư vấn" }));
  await screen.findByText(intro.greeting);
};
const box = () => screen.getByLabelText("Nhập câu hỏi") as HTMLTextAreaElement;
const sendBtn = () => screen.getByRole("button", { name: /^(Gửi|Chờ)/ });

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  sessionStorage.clear();
  m.suggestions.mockResolvedValue(intro);
});
afterEach(cleanup);

describe("ChatWidget", () => {
  it("mở khung: lời chào + câu hỏi gợi ý từ API, ô nhập được focus", async () => {
    render(<ChatWidget />);
    expect(screen.queryByLabelText("Nhập câu hỏi")).toBeNull();
    await openChat();
    expect(screen.getByRole("button", { name: "Giờ mở cửa?" })).toBeInTheDocument();
    expect(document.activeElement).toBe(box());
  });

  it("Esc đóng khung và trả focus về nút mở", async () => {
    render(<ChatWidget />);
    await openChat();
    fireEvent.keyDown(box(), { key: "Escape" });
    expect(screen.queryByLabelText("Nhập câu hỏi")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Mở chat tư vấn" }));
  });

  it("bấm gợi ý gửi câu hỏi; câu trả lời đi kèm gợi ý để hỏi tiếp", async () => {
    m.ask.mockResolvedValue(answer());
    render(<ChatWidget />);
    await openChat();
    fireEvent.click(screen.getByRole("button", { name: "Bảo hành thế nào?" }));
    expect(await screen.findByText("Mở cửa 8h-21h")).toBeInTheDocument();
    expect(m.ask).toHaveBeenCalledWith("Bảo hành thế nào?");
    m.ask.mockResolvedValue(answer("Đổi trong 30 ngày", { suggestions: [] }));
    fireEvent.click(screen.getByRole("button", { name: "Đổi trả?" }));
    expect(await screen.findByText("Đổi trong 30 ngày")).toBeInTheDocument();
  });

  it("Enter gửi, Shift+Enter không gửi; giới hạn 300 ký tự và đếm ký tự", async () => {
    m.ask.mockResolvedValue(answer());
    render(<ChatWidget />);
    await openChat();
    expect(box()).toHaveAttribute("maxlength", "300");
    fireEvent.change(box(), { target: { value: "xin chào" } });
    expect(screen.getByText("8/300")).toBeInTheDocument();
    fireEvent.keyDown(box(), { key: "Enter", shiftKey: true });
    expect(m.ask).not.toHaveBeenCalled();
    fireEvent.keyDown(box(), { key: "Enter" });
    await waitFor(() => expect(m.ask).toHaveBeenCalledWith("xin chào"));
    await waitFor(() => expect(box().value).toBe(""));
  });

  it("câu trả lời là văn bản thuần: không render HTML/Markdown, giữ xuống dòng", async () => {
    m.ask.mockResolvedValue(answer("<b>đậm</b> <script>alert(1)</script>\n**sao**"));
    const { container } = render(<ChatWidget />);
    await openChat();
    fireEvent.change(box(), { target: { value: "hi" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    const p = await screen.findByText(/<b>đậm<\/b>/);
    expect(p).toHaveClass("whitespace-pre-line");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(p.textContent).toContain("**sao**");
  });

  it("chống gửi đúp khi đang chờ trả lời, hiện chỉ báo 'đang trả lời'", async () => {
    let resolve!: (v: unknown) => void;
    m.ask.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<ChatWidget />);
    await openChat();
    fireEvent.change(box(), { target: { value: "câu 1" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(await screen.findByText("Đang trả lời...")).toBeInTheDocument();
    fireEvent.change(box(), { target: { value: "câu 2" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Giờ mở cửa?" }));
    expect(m.ask).toHaveBeenCalledTimes(1);
    await act(async () => resolve(answer()));
    await waitFor(() => expect(screen.queryByText("Đang trả lời...")).toBeNull());
  });

  it("lỗi mạng: thông báo ngay trong khung", async () => {
    m.ask.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "mạng"));
    render(<ChatWidget />);
    await openChat();
    fireEvent.change(box(), { target: { value: "hi" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(await screen.findByText(/Không kết nối được máy chủ/)).toBeInTheDocument();
  });

  it("RATE_LIMITED: toast nêu số giây và khóa gửi trong thời gian chờ", async () => {
    m.ask.mockRejectedValue(new ApiError(429, "RATE_LIMITED", "x", [], 25));
    render(<ChatWidget />);
    await openChat();
    fireEvent.change(box(), { target: { value: "hi" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("warning", expect.stringContaining("25 giây")));
    await waitFor(() => expect(sendBtn()).toHaveTextContent(/Chờ \d+s/));
    fireEvent.change(box(), { target: { value: "lại" } });
    expect(sendBtn()).toBeDisabled();
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(m.ask).toHaveBeenCalledTimes(1);
  });

  it("lịch sử lưu sessionStorage, khôi phục khi tải lại và xóa được", async () => {
    m.ask.mockResolvedValue(answer());
    const first = render(<ChatWidget />);
    await openChat();
    fireEvent.change(box(), { target: { value: "hi" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await screen.findByText("Mở cửa 8h-21h");
    expect(JSON.parse(sessionStorage.getItem(CHAT_HISTORY_KEY)!)).toHaveLength(2);
    first.unmount();

    render(<ChatWidget />);
    await openChat();
    expect(screen.getByText("Mở cửa 8h-21h")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xóa hội thoại" }));
    expect(screen.queryByText("Mở cửa 8h-21h")).toBeNull();
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem(CHAT_HISTORY_KEY)!)).toEqual([]));
  });

  it("vùng hội thoại có role=log và aria-live=polite", async () => {
    render(<ChatWidget />);
    await openChat();
    expect(screen.getByRole("log")).toHaveAttribute("aria-live", "polite");
  });
});
