import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDetail, ProductSummary } from "@/types/catalog";
import { ApiError } from "@/utils/errors";

const m = vi.hoisted(() => ({
  push: vi.fn(),
  notify: vi.fn(),
  addToCart: vi.fn(),
  getProduct: vi.fn(),
  toggleWishlist: vi.fn(),
  auth: { status: "unauthenticated" as "unauthenticated" | "authenticated" },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: m.push }), usePathname: () => "/products" }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/utils/notify", () => ({ notify: (...a: unknown[]) => m.notify(...a) }));
vi.mock("@/store/auth-context", () => ({ useAuth: () => ({ status: m.auth.status, role: "user", user: null }) }));
vi.mock("@/store/cart-store", () => ({ addToCart: (...a: unknown[]) => m.addToCart(...a) }));
vi.mock("@/services/product.service", () => ({ getProduct: (...a: unknown[]) => m.getProduct(...a) }));
vi.mock("@/store/wishlist-store", () => ({
  toggleWishlist: (...a: unknown[]) => m.toggleWishlist(...a),
  useIsWishlisted: () => false,
}));

import { ProductCard } from "./ProductCard";
import { ProductBuyBox } from "./ProductDetailClient";

const summary: ProductSummary = {
  id: 1,
  code: "LG-001",
  name: "Nhẫn vàng",
  slug: "nhan-vang",
  price: 1000,
  salePrice: null,
  discountPercent: null,
  primaryImageUrl: null,
  inStock: true,
  avgRating: 0,
  reviewCount: 0,
  isFeatured: false,
  targetGroup: "unisex",
  category: { id: 1, name: "Nhẫn", slug: "nhan" },
};

const detail = (variants: ProductDetail["variants"]): ProductDetail => ({
  ...summary,
  description: null,
  weight: null,
  warrantyInfo: null,
  certificate: null,
  soldCount: 0,
  breadcrumb: [],
  material: null,
  collection: null,
  images: [],
  variants,
  gemstones: [],
  related: [],
});

const addBtn = () => screen.getByRole("button", { name: /Thêm Nhẫn vàng vào giỏ hàng/ });

beforeEach(() => {
  Object.values(m).forEach((v) => typeof v === "function" && "mockReset" in v && v.mockReset());
  m.auth.status = "unauthenticated";
  window.history.pushState({}, "", "/products?category=nhan");
});
afterEach(cleanup);

describe("thêm vào giỏ khi chưa đăng nhập", () => {
  it("thẻ sản phẩm: toast yêu cầu đăng nhập rồi chuyển /login kèm redirect, không gọi API", async () => {
    render(<ProductCard product={summary} />);
    fireEvent.click(addBtn());
    await waitFor(() => expect(m.push).toHaveBeenCalledWith("/login?redirect=%2Fproducts%3Fcategory%3Dnhan"));
    expect(m.notify).toHaveBeenCalledWith("info", "Vui lòng đăng nhập để tiếp tục");
    expect(m.getProduct).not.toHaveBeenCalled();
    expect(m.addToCart).not.toHaveBeenCalled();
  });
  it("trái tim: cùng cách xử lý, không gọi API", () => {
    render(<ProductCard product={summary} />);
    fireEvent.click(screen.getByRole("button", { name: /yêu thích/ }));
    expect(m.push).toHaveBeenCalledWith("/login?redirect=%2Fproducts%3Fcategory%3Dnhan");
    expect(m.toggleWishlist).not.toHaveBeenCalled();
  });
  it("trang chi tiết: thêm vào giỏ cũng yêu cầu đăng nhập", async () => {
    render(<ProductBuyBox product={detail([{ id: 1, sku: "a", size: "", stock: 5 }])} />);
    fireEvent.click(screen.getByRole("button", { name: /Thêm vào giỏ hàng/ }));
    await waitFor(() => expect(m.push).toHaveBeenCalledWith(expect.stringContaining("/login?redirect=")));
    expect(m.addToCart).not.toHaveBeenCalled();
  });
});

describe("thêm nhanh từ thẻ (đã đăng nhập)", () => {
  beforeEach(() => {
    m.auth.status = "authenticated";
  });
  it("đúng một biến thể (không có hai trường): thêm thẳng", async () => {
    m.getProduct.mockResolvedValue(detail([{ id: 11, sku: "a", size: "12", stock: 3 }]));
    m.addToCart.mockResolvedValue({});
    render(<ProductCard product={summary} />);
    fireEvent.click(addBtn());
    await waitFor(() => expect(m.addToCart).toHaveBeenCalledWith(11, 1));
    expect(m.notify).toHaveBeenCalledWith("success", expect.stringContaining("Đã thêm"));
    expect(m.push).not.toHaveBeenCalled();
  });
  it("variantCount=1 + singleVariantId: thêm thẳng, KHÔNG gọi chi tiết sản phẩm", async () => {
    m.addToCart.mockResolvedValue({});
    render(<ProductCard product={{ ...summary, variantCount: 1, singleVariantId: 77 }} />);
    fireEvent.click(addBtn());
    await waitFor(() => expect(m.addToCart).toHaveBeenCalledWith(77, 1));
    expect(m.getProduct).not.toHaveBeenCalled();
    expect(m.push).not.toHaveBeenCalled();
  });
  it("variantCount>1: sang trang chi tiết, không gọi chi tiết sản phẩm, không thêm giỏ", async () => {
    render(<ProductCard product={{ ...summary, variantCount: 3, singleVariantId: null }} />);
    fireEvent.click(addBtn());
    await waitFor(() => expect(m.push).toHaveBeenCalledWith("/products/nhan-vang"));
    expect(m.getProduct).not.toHaveBeenCalled();
    expect(m.addToCart).not.toHaveBeenCalled();
  });
  it("variantCount=0: nút bị vô hiệu hóa", () => {
    render(<ProductCard product={{ ...summary, variantCount: 0, singleVariantId: null }} />);
    expect(addBtn()).toBeDisabled();
  });
  it("variantCount=1 nhưng lỗi INSUFFICIENT_STOCK: toast số còn lại", async () => {
    m.addToCart.mockRejectedValue(new ApiError(409, "INSUFFICIENT_STOCK", "x", [], undefined, undefined, { available: 1, inCart: 1 }));
    render(<ProductCard product={{ ...summary, variantCount: 1, singleVariantId: 77 }} />);
    fireEvent.click(addBtn());
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", expect.stringContaining("Chỉ còn 1")));
  });
  it("backend cũ (thiếu hai trường): rơi về lấy chi tiết sản phẩm", async () => {
    m.getProduct.mockResolvedValue(detail([{ id: 11, sku: "a", size: "12", stock: 3 }]));
    m.addToCart.mockResolvedValue({});
    render(<ProductCard product={summary} />);
    fireEvent.click(addBtn());
    await waitFor(() => expect(m.addToCart).toHaveBeenCalledWith(11, 1));
    expect(m.getProduct).toHaveBeenCalledTimes(1);
  });
  it("nhiều biến thể (không có hai trường): sang trang chi tiết để chọn size", async () => {
    m.getProduct.mockResolvedValue(
      detail([
        { id: 11, sku: "a", size: "10", stock: 3 },
        { id: 12, sku: "b", size: "12", stock: 3 },
      ]),
    );
    render(<ProductCard product={summary} />);
    fireEvent.click(addBtn());
    await waitFor(() => expect(m.push).toHaveBeenCalledWith("/products/nhan-vang"));
    expect(m.addToCart).not.toHaveBeenCalled();
  });
});

describe("trang chi tiết (đã đăng nhập)", () => {
  beforeEach(() => {
    m.auth.status = "authenticated";
  });
  const sizes = [
    { id: 1, sku: "a", size: "10", stock: 5 },
    { id: 2, sku: "b", size: "12", stock: 2 },
  ];

  it("bắt buộc chọn size khi có nhiều size", async () => {
    render(<ProductBuyBox product={detail(sizes)} />);
    fireEvent.click(screen.getByRole("button", { name: /Thêm vào giỏ hàng/ }));
    expect(await screen.findByText(/Vui lòng chọn size trước khi tiếp tục/)).toBeInTheDocument();
    expect(m.addToCart).not.toHaveBeenCalled();
  });
  it("INSUFFICIENT_STOCK: toast nêu số còn lại và số trong giỏ", async () => {
    m.addToCart.mockRejectedValue(
      new ApiError(409, "INSUFFICIENT_STOCK", "x", [], undefined, undefined, { available: 2, inCart: 1 }),
    );
    render(<ProductBuyBox product={detail(sizes)} />);
    fireEvent.click(screen.getByLabelText("12"));
    fireEvent.click(screen.getByRole("button", { name: /Thêm vào giỏ hàng/ }));
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", expect.stringMatching(/Chỉ còn 2.*đã có 1/)));
  });
  it("QUANTITY_LIMIT_EXCEEDED và ITEM_UNAVAILABLE có thông báo rõ nghĩa", async () => {
    render(<ProductBuyBox product={detail(sizes)} />);
    fireEvent.click(screen.getByLabelText("10"));
    m.addToCart.mockRejectedValueOnce(new ApiError(400, "QUANTITY_LIMIT_EXCEEDED", "x"));
    fireEvent.click(screen.getByRole("button", { name: /Thêm vào giỏ hàng/ }));
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", expect.stringContaining("tối đa 10")));
    m.addToCart.mockRejectedValueOnce(new ApiError(409, "ITEM_UNAVAILABLE", "x"));
    fireEvent.click(screen.getByRole("button", { name: /Thêm vào giỏ hàng/ }));
    await waitFor(() => expect(m.notify).toHaveBeenCalledWith("error", expect.stringContaining("ngừng bán")));
  });
  it("Mua ngay: thêm giỏ rồi sang /cart", async () => {
    m.addToCart.mockResolvedValue({});
    render(<ProductBuyBox product={detail(sizes)} />);
    fireEvent.click(screen.getByLabelText("10"));
    fireEvent.click(screen.getByRole("button", { name: "Mua ngay" }));
    await waitFor(() => expect(m.push).toHaveBeenCalledWith("/cart"));
    expect(m.addToCart).toHaveBeenCalledWith(1, 1);
  });
  it("Mua ngay lỗi thì không chuyển trang", async () => {
    m.addToCart.mockRejectedValue(new ApiError(409, "ITEM_UNAVAILABLE", "x"));
    render(<ProductBuyBox product={detail(sizes)} />);
    fireEvent.click(screen.getByLabelText("10"));
    fireEvent.click(screen.getByRole("button", { name: "Mua ngay" }));
    await waitFor(() => expect(m.notify).toHaveBeenCalled());
    expect(m.push).not.toHaveBeenCalledWith("/cart");
  });
});
