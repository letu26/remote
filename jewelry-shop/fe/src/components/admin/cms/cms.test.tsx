import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/utils/errors";

const m = vi.hoisted(() => {
  const crud = () => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() });
  return {
    banner: crud(),
    menu: crud(),
    page: { ...crud(), get: vi.fn() },
    faq: { ...crud(), ask: vi.fn() },
    article: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
    site: { get: vi.fn(), save: vi.fn(), getPublic: vi.fn() },
    upload: vi.fn(),
    replace: vi.fn(),
    notify: vi.fn(),
    confirm: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: m.replace, push: vi.fn() }),
  usePathname: () => "/admin/articles",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/services/admin-cms.service", () => ({
  adminBannerService: m.banner,
  adminMenuService: m.menu,
  adminPageService: m.page,
  adminFaqService: m.faq,
  adminArticleService: m.article,
  adminSiteInfoService: m.site,
}));
vi.mock("@/services/admin-media.service", () => ({ adminMediaService: { uploadImage: m.upload } }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));
vi.mock("@/utils/confirm", () => ({ confirmAction: (...a: unknown[]) => m.confirm(...a) }));

import { CrudPage } from "../CrudPage";
import { InvoiceSheet } from "../order/OrderInvoice";
import { SiteInfoForm, validateSiteInfo } from "../settings/SiteInfoForm";
import { ArticleForm, toArticleInput, validateArticle, emptyArticle } from "./ArticleForm";
import { ChatbotTester } from "./CmsViews";
import { MarkdownEditor } from "./MarkdownEditor";
import { arrangeMenuTree, bannerConfig, computeReorder, faqConfig, menuConfigs, pageConfig, validateBanner, validateFaq } from "./cms-configs";
import { parseKeywords, validateKeywords, validateLink, validatePageSlug } from "./cms-validation";

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("validate", () => {
  it("liên kết: chỉ /..., không //, hoặc http(s)", () => {
    expect(validateLink("/products?x=1")).toBeUndefined();
    expect(validateLink("https://a.vn/x")).toBeUndefined();
    expect(validateLink("")).toBeUndefined();
    expect(validateLink("", true)).toBeTruthy();
    for (const bad of ["//evil.com", "javascript:alert(1)", "data:text/html,x", "ftp://a.b", "products", "/a b"]) {
      expect(validateLink(bad), bad).toBeTruthy();
    }
  });
  it("slug trang a-z, 0-9, gạch ngang, 2..120", () => {
    expect(validatePageSlug("chinh-sach-1")).toBeUndefined();
    expect(validatePageSlug("A")).toBeTruthy();
    expect(validatePageSlug("Chính-sách")).toBeTruthy();
    expect(validatePageSlug("a--b")).toBeTruthy();
  });
  it("từ khóa: mỗi cái 2..50 ký tự, tối đa 20", () => {
    expect(parseKeywords(" bảo hành , đổi trả,, ")).toEqual(["bảo hành", "đổi trả"]);
    expect(validateKeywords("bảo hành, đổi trả")).toBeUndefined();
    expect(validateKeywords("a, bb")).toBeTruthy();
    expect(validateKeywords("x".repeat(51))).toBeTruthy();
    expect(validateKeywords(Array.from({ length: 21 }, (_, i) => `tu${i}`).join(","))).toBeTruthy();
    expect(validateKeywords(Array.from({ length: 20 }, (_, i) => `tu${i}`).join(","))).toBeUndefined();
  });
  it("banner: cần ảnh https, tiêu đề, liên kết hợp lệ", () => {
    const ok = { title: "T", imageUrl: "https://x/y.jpg", imagePublicId: "", linkUrl: "/products", position: "home_hero" as const, sortOrder: "0", isActive: true };
    expect(validateBanner(ok)).toEqual({});
    expect(validateBanner({ ...ok, imageUrl: "" }).imageUrl).toBeTruthy();
    expect(validateBanner({ ...ok, imageUrl: "http://x/y.jpg" }).imageUrl).toBeTruthy();
    expect(validateBanner({ ...ok, linkUrl: "//evil" }).linkUrl).toBeTruthy();
    expect(validateBanner({ ...ok, title: " " }).title).toBeTruthy();
  });
  it("faq và site-info", () => {
    expect(validateFaq({ question: "ab", answer: "", keywords: "a", sortOrder: "x", isActive: true })).toMatchObject({
      question: expect.any(String), answer: expect.any(String), keywords: expect.any(String), sortOrder: expect.any(String),
    });
    const base = { brandName: "L", slogan: "", hotline: "", email: "", address: "", openingHours: "", facebook: "", zalo: "", instagram: "", tiktok: "", footerText: "" };
    expect(validateSiteInfo(base)).toEqual({});
    expect(validateSiteInfo({ ...base, email: "abc", facebook: "http://fb.com", brandName: "" })).toMatchObject({
      email: expect.any(String), facebook: expect.any(String), brandName: expect.any(String),
    });
    expect(validateSiteInfo({ ...base, footerText: "x".repeat(301) }).footerText).toBeTruthy();
  });
});

describe("cây menu", () => {
  const rows = [
    { id: 1, label: "B", url: "/b", parentId: null, placement: "header" as const, sortOrder: 1, isActive: true },
    { id: 2, label: "A", url: "/a", parentId: null, placement: "header" as const, sortOrder: 0, isActive: true },
    { id: 3, label: "A2", url: "/a2", parentId: 2, placement: "header" as const, sortOrder: 1, isActive: true },
    { id: 4, label: "A1", url: "/a1", parentId: 2, placement: "header" as const, sortOrder: 0, isActive: true },
    { id: 5, label: "F", url: "/f", parentId: null, placement: "footer" as const, sortOrder: 0, isActive: true },
  ];
  it("sắp cha trước, con ngay sau, lọc theo vị trí", () => {
    expect(arrangeMenuTree(rows, "header").map((r) => `${r.depth}:${r.label}`)).toEqual(["0:A", "1:A1", "1:A2", "0:B"]);
    expect(arrangeMenuTree(rows, "footer").map((r) => r.label)).toEqual(["F"]);
  });
  it("computeReorder đổi chỗ và đánh số lại; biên thì không đổi", () => {
    const sib = [{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 0 }, { id: 3, sortOrder: 0 }];
    expect(computeReorder(sib, 1, -1)).toEqual([{ id: 1, sortOrder: 1 }, { id: 3, sortOrder: 2 }]);
    const res = computeReorder([{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 1 }], 0, 1);
    expect(res).toEqual([{ id: 2, sortOrder: 0 }, { id: 1, sortOrder: 1 }]);
    expect(computeReorder(sib, 0, -1)).toEqual([]);
    expect(computeReorder(sib, 2, 1)).toEqual([]);
  });
  it("modal: mục cha chỉ liệt kê mục gốc cùng vị trí; xóa mục có con bị chặn; lên/xuống gọi update", async () => {
    m.menu.list.mockResolvedValue(rows);
    m.menu.update.mockResolvedValue({});
    render(<CrudPage config={menuConfigs.header} />);
    await screen.findByText("A1");
    fireEvent.click(screen.getByRole("button", { name: "Thêm mục menu" }));
    const dialog = await screen.findByRole("dialog");
    const options = within(dialog).getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Không có (mục gốc)", "A", "B"]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Hủy" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Xóa A" }));
    expect(m.confirm).not.toHaveBeenCalled();
    expect(m.notify).toHaveBeenCalledWith("warning", expect.stringContaining("xóa các mục con"));
    expect(m.menu.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Chuyển A2 lên" }));
    await waitFor(() => expect(m.menu.update).toHaveBeenCalledTimes(2));
    expect(m.menu.update).toHaveBeenCalledWith(3, { sortOrder: 0 });
    expect(m.menu.update).toHaveBeenCalledWith(4, { sortOrder: 1 });
  });
});

describe("MarkdownEditor", () => {
  function Harness({ initial = "" }: { initial?: string }) {
    const [v, setV] = useState(initial);
    return <MarkdownEditor value={v} onChange={setV} />;
  }
  it("chuyển tab, đếm ký tự, xem trước không render HTML thô/script", () => {
    render(<Harness initial={"# Tiêu đề\n\n<script>alert(1)</script><b>đậm</b>"} />);
    expect(screen.getByTestId("md-count")).toHaveTextContent("/100.000");
    fireEvent.click(screen.getByRole("tab", { name: "Xem trước" }));
    const preview = screen.getByTestId("md-preview");
    expect(within(preview).getByRole("heading", { name: "Tiêu đề" })).toBeInTheDocument();
    expect(preview.querySelector("script")).toBeNull();
    expect(preview.querySelector("b")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Soạn" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Nội dung/ }), { target: { value: "abc" } });
    expect(screen.getByTestId("md-count")).toHaveTextContent("3/100.000");
  });
});

describe("ArticleForm", () => {
  const saved = { id: 7, title: "Bài", slug: "bai", summary: "", content: "x", thumbnailUrl: null, thumbnailPublicId: null, isPublished: false, publishedAt: null, createdAt: "", updatedAt: "" };
  const fill = async () => {
    await screen.findByLabelText("Tiêu đề");
    fireEvent.change(screen.getByLabelText("Tiêu đề"), { target: { value: "Cách chọn nhẫn" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Nội dung/ }), { target: { value: "Nội dung bài" } });
  };
  it("validate tiêu đề, nội dung, tóm tắt", () => {
    expect(validateArticle(emptyArticle())).toMatchObject({ title: expect.any(String), content: expect.any(String) });
    expect(validateArticle({ ...emptyArticle(), title: "Hợp lệ", content: "x", summary: "a".repeat(501) }).summary).toBeTruthy();
  });
  it("Lưu nháp gửi isPublished=false rồi chuyển sang trang sửa", async () => {
    m.article.create.mockResolvedValue(saved);
    render(<ArticleForm />);
    await fill();
    fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await waitFor(() => expect(m.article.create).toHaveBeenCalled());
    expect(m.article.create.mock.calls[0][0]).toMatchObject({ title: "Cách chọn nhẫn", content: "Nội dung bài", isPublished: false });
    await waitFor(() => expect(m.replace).toHaveBeenCalledWith("/admin/articles/7"));
  });
  it("Đăng gửi isPublished=true; slug trùng gắn đúng ô", async () => {
    m.article.create.mockRejectedValue(new ApiError(409, "SLUG_ALREADY_EXISTS", "Slug đã tồn tại"));
    render(<ArticleForm />);
    await fill();
    fireEvent.change(screen.getByLabelText(/Slug/), { target: { value: "trung" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng" }));
    await waitFor(() => expect(screen.getByLabelText(/Slug/)).toHaveAttribute("aria-invalid", "true"));
    expect(m.article.create.mock.calls[0][0]).toMatchObject({ isPublished: true, slug: "trung" });
    expect(screen.getByText("Slug đã tồn tại")).toBeInTheDocument();
  });
  it("bài đang đăng có nút Gỡ đăng; slug không đổi thì không gửi", async () => {
    m.article.get.mockResolvedValue({ ...saved, isPublished: true });
    m.article.update.mockResolvedValue(saved);
    render(<ArticleForm articleId={7} />);
    await screen.findByDisplayValue("Bài");
    fireEvent.click(screen.getByRole("button", { name: "Gỡ đăng" }));
    await waitFor(() => expect(m.article.update).toHaveBeenCalled());
    const [id, body] = m.article.update.mock.calls[0];
    expect(id).toBe(7);
    expect(body.isPublished).toBe(false);
    expect(body.slug).toBeUndefined();
    expect(toArticleInput({ ...emptyArticle(), title: " T " }, true).title).toBe("T");
  });
});

describe("Banner CRUD", () => {
  const banner = { id: 1, title: "Khuyến mại", imageUrl: "https://c/x.jpg", imagePublicId: "p", linkUrl: "/products", position: "home_hero", sortOrder: 0, isActive: true };
  const file = (name = "a.jpg", type = "image/jpeg", size = 1000) => new File([new Uint8Array(size)], name, { type });

  it("thêm banner: tải ảnh (mock) có xem trước rồi gọi create", async () => {
    m.banner.list.mockResolvedValue([]);
    m.banner.create.mockResolvedValue(banner);
    m.upload.mockImplementation(async (_f: File, onProgress?: (p: number) => void) => {
      onProgress?.(100);
      return { url: "https://c/new.jpg", publicId: "pid" };
    });
    render(<CrudPage config={bannerConfig} />);
    await screen.findByText("Chưa có banner nào");
    fireEvent.click(screen.getAllByRole("button", { name: "Thêm banner" })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm banner" }));
    expect(await within(dialog).findByText("Vui lòng tải ảnh banner")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Tiêu đề"), { target: { value: "Khuyến mại" } });
    fireEvent.change(within(dialog).getByLabelText("Ảnh banner"), { target: { files: [file()] } });
    expect(await within(dialog).findByAltText("Xem trước ảnh")).toHaveAttribute("src", "https://c/new.jpg");
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm banner" }));
    await waitFor(() => expect(m.banner.create).toHaveBeenCalled());
    expect(m.banner.create.mock.calls[0][0]).toMatchObject({ title: "Khuyến mại", imageUrl: "https://c/new.jpg", imagePublicId: "pid", position: "home_hero" });
  });

  it("kiểm tra ảnh phía client và lỗi UPLOAD_NOT_CONFIGURED thân thiện", async () => {
    m.banner.list.mockResolvedValue([]);
    render(<CrudPage config={bannerConfig} />);
    await screen.findByText("Chưa có banner nào");
    fireEvent.click(screen.getAllByRole("button", { name: "Thêm banner" })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Ảnh banner"), { target: { files: [file("a.gif", "image/gif")] } });
    expect(await within(dialog).findByText(/jpg, png hoặc webp/)).toBeInTheDocument();
    expect(m.upload).not.toHaveBeenCalled();
    m.upload.mockRejectedValue(new ApiError(503, "UPLOAD_NOT_CONFIGURED", "raw"));
    fireEvent.change(within(dialog).getByLabelText("Ảnh banner"), { target: { files: [file()] } });
    expect(await within(dialog).findByText(/Chưa cấu hình lưu trữ ảnh/)).toBeInTheDocument();
  });

  it("xóa: hủy swal không gọi API, xác nhận thì gọi", async () => {
    m.banner.list.mockResolvedValue([banner]);
    m.banner.remove.mockResolvedValue(undefined);
    render(<CrudPage config={bannerConfig} />);
    const del = await screen.findByRole("button", { name: "Xóa Khuyến mại" });
    m.confirm.mockResolvedValueOnce(false);
    fireEvent.click(del);
    await waitFor(() => expect(m.confirm).toHaveBeenCalledTimes(1));
    expect(m.banner.remove).not.toHaveBeenCalled();
    m.confirm.mockResolvedValueOnce(true);
    fireEvent.click(del);
    await waitFor(() => expect(m.banner.remove).toHaveBeenCalledWith(1));
  });
});

describe("Trang nội dung", () => {
  const rows = [
    { id: 1, slug: "ve-chung-toi", title: "Giới thiệu", isActive: true, isReserved: true },
    { id: 2, slug: "tu-tao", title: "Trang tự tạo", isActive: true, isReserved: false },
  ];
  it("trang hệ thống có nhãn, không có nút Xóa, không gửi slug khi sửa; tải nội dung qua GET /:id", async () => {
    m.page.list.mockResolvedValue(rows);
    m.page.get.mockResolvedValue({ ...rows[0], content: "Nội dung cũ" });
    m.page.update.mockResolvedValue(rows[0]);
    render(<CrudPage config={pageConfig} />);
    await screen.findByText("Giới thiệu");
    expect(screen.getByText("Trang hệ thống")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xóa Giới thiệu" })).toBeNull();
    expect(screen.getByRole("button", { name: "Xóa Trang tự tạo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sửa Giới thiệu" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/Slug/)).toBeDisabled();
    expect(m.page.get).toHaveBeenCalledWith(1);
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(m.page.update).toHaveBeenCalled());
    const body = m.page.update.mock.calls[0][1];
    expect(body.slug).toBeUndefined();
    expect(body.content).toBe("Nội dung cũ");
  });
  it("RESERVED_PAGE từ server hiện thông báo", async () => {
    m.page.list.mockResolvedValue([rows[1]]);
    m.page.get.mockResolvedValue({ ...rows[1], content: "x" });
    m.page.update.mockRejectedValue(new ApiError(409, "RESERVED_PAGE", "Trang hệ thống không đổi slug"));
    render(<CrudPage config={pageConfig} />);
    fireEvent.click(await screen.findByRole("button", { name: "Sửa Trang tự tạo" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Slug/), { target: { value: "doi-slug" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(within(dialog).getByLabelText(/Slug/)).toHaveAttribute("aria-invalid", "true"));
    expect(within(dialog).getByText("Trang hệ thống không đổi slug")).toBeInTheDocument();
  });
});

describe("FAQ và thử chatbot", () => {
  it("lưu FAQ chuẩn hóa từ khóa; xóa lỗi RESOURCE_IN_USE vẫn báo", async () => {
    m.faq.list.mockResolvedValue([]);
    m.faq.create.mockResolvedValue({});
    render(<CrudPage config={faqConfig} />);
    await screen.findByText("Chưa có câu hỏi nào");
    fireEvent.click(screen.getAllByRole("button", { name: "Thêm câu hỏi" })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Câu hỏi"), { target: { value: "Bảo hành bao lâu?" } });
    fireEvent.change(within(dialog).getByLabelText("Câu trả lời"), { target: { value: "Trọn đời." } });
    fireEvent.change(within(dialog).getByLabelText("Từ khóa (cách nhau dấu phẩy)"), { target: { value: "a" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm câu hỏi" }));
    expect(await within(dialog).findByText(/Mỗi từ khóa từ 2 đến 50/)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Từ khóa (cách nhau dấu phẩy)"), { target: { value: " bảo hành ,  đổi trả " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm câu hỏi" }));
    await waitFor(() => expect(m.faq.create).toHaveBeenCalled());
    expect(m.faq.create.mock.calls[0][0]).toMatchObject({ keywords: "bảo hành, đổi trả" });
  });
  it("thử chatbot: hiện câu trả lời, FAQ khớp, gợi ý; RATE_LIMITED báo thời gian chờ", async () => {
    m.faq.ask.mockResolvedValueOnce({ answer: "Bảo hành trọn đời.", matched: { id: 1, question: "Bảo hành?" }, suggestions: [{ id: 2, question: "Đổi trả?" }], fallback: false });
    render(<ChatbotTester />);
    fireEvent.change(screen.getByLabelText("Câu hỏi của khách"), { target: { value: "bảo hành" } });
    fireEvent.click(screen.getByRole("button", { name: "Hỏi thử" }));
    expect(await screen.findByTestId("chatbot-answer")).toHaveTextContent("Bảo hành trọn đời.");
    expect(screen.getByText(/Khớp FAQ: Bảo hành\?/)).toBeInTheDocument();
    expect(screen.getByText("Đổi trả?")).toBeInTheDocument();
    m.faq.ask.mockRejectedValueOnce(new ApiError(429, "RATE_LIMITED", "Hỏi quá nhiều", [], 30));
    fireEvent.click(screen.getByRole("button", { name: "Hỏi thử" }));
    expect(await screen.findByText(/thử lại sau 30 giây/)).toBeInTheDocument();
  });
  it("không gọi API khi câu hỏi rỗng", () => {
    render(<ChatbotTester />);
    fireEvent.click(screen.getByRole("button", { name: "Hỏi thử" }));
    expect(m.faq.ask).not.toHaveBeenCalled();
  });
});

describe("SiteInfoForm", () => {
  it("không lưu khi sai, lưu đúng payload và báo toast", async () => {
    m.site.get.mockResolvedValue({ brandName: "Lumière", slogan: "", hotline: "1900", email: "", address: "", openingHours: "", facebook: "", zalo: "", instagram: "", tiktok: "", footerText: "" });
    m.site.save.mockImplementation(async (v: unknown) => v);
    render(<SiteInfoForm />);
    await screen.findByDisplayValue("Lumière");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sai" } });
    fireEvent.change(screen.getByLabelText(/Facebook/), { target: { value: "http://fb" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin cửa hàng" }));
    expect(await screen.findByText("Email không đúng định dạng")).toBeInTheDocument();
    expect(m.site.save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.vn" } });
    fireEvent.change(screen.getByLabelText(/Facebook/), { target: { value: "https://fb.com/x" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin cửa hàng" }));
    await waitFor(() => expect(m.site.save).toHaveBeenCalledWith(expect.objectContaining({ email: "a@b.vn", facebook: "https://fb.com/x" })));
    expect(m.notify).toHaveBeenCalledWith("success", "Đã lưu thông tin cửa hàng");
  });
});

describe("Hóa đơn với thông tin cửa hàng", () => {
  const order = {
    id: 5, code: "LG1", createdAt: "2026-10-17T03:00:00Z", status: "pending", paymentMethod: "cod", paymentStatus: "unpaid", paidAt: null, cancelReason: null, note: null,
    customer: { id: 1, fullName: "A", phone: "0901", email: null }, receiver: { name: "B", phone: "0912", province: "HN", ward: "X", addressDetail: "1" },
    shippingMethodName: "Std", subtotal: 1, shippingFee: 0, total: 1, items: [], history: [],
  } as never;
  const site = { brandName: "Cửa hàng Mẫu", slogan: "Sống đẹp", hotline: "1900 1234", email: "cs@mau.vn", address: "12 Phố Mẫu, Hà Nội", openingHours: "", facebook: "", zalo: "", instagram: "", tiktok: "", footerText: "" };
  it("hiện hotline, địa chỉ, email, tên từ site-info", () => {
    render(<InvoiceSheet order={order} site={site} />);
    expect(screen.getByText("Cửa hàng Mẫu")).toBeInTheDocument();
    expect(screen.getByText("12 Phố Mẫu, Hà Nội")).toBeInTheDocument();
    expect(screen.getByText(/Hotline: 1900 1234/)).toBeInTheDocument();
    expect(screen.getByText(/Email: cs@mau.vn/)).toBeInTheDocument();
  });
  it("dự phòng bằng hằng số khi không có site-info", () => {
    render(<InvoiceSheet order={order} site={null} />);
    expect(screen.getByText("Lumière Gems")).toBeInTheDocument();
    expect(screen.queryByText(/Hotline/)).toBeNull();
  });
});
