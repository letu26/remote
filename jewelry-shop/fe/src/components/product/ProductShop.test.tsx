import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Paginated, ProductDetail, ProductSummary } from "@/types/catalog";

const push = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/products",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, sizes } = props as { src: string; alt: string; sizes: string };
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} sizes={sizes} />;
  },
}));
vi.mock("@/store/auth-context", () => ({ useAuth: () => ({ status: "unauthenticated", role: null, user: null }) }));
vi.mock("@/services/product.service", () => ({
  listProducts: vi.fn(),
  getFilterOptions: vi.fn(async () => ({ categories: [], materials: [], gemstones: [], collections: [] })),
  findCategory: () => undefined,
}));

import { listProducts } from "@/services/product.service";
import { ProductBuyBox } from "./ProductDetailClient";
import { ProductCard } from "./ProductCard";
import { ProductListing } from "./ProductListing";

const summary = (over: Partial<ProductSummary> = {}): ProductSummary => ({
  id: 1,
  code: "LG-001",
  name: "Nhẫn vàng",
  slug: "nhan-vang",
  price: 10_000_000,
  salePrice: null,
  discountPercent: null,
  primaryImageUrl: null,
  inStock: true,
  avgRating: 0,
  reviewCount: 0,
  isFeatured: false,
  targetGroup: "women",
  category: { id: 1, name: "Nhẫn", slug: "nhan" },
  ...over,
});

const detail = (variants: ProductDetail["variants"]): ProductDetail => ({
  ...summary(),
  description: null,
  weight: 3,
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

const page = (items: ProductSummary[]): Paginated<ProductSummary> => ({
  items,
  page: 1,
  pageSize: 12,
  total: items.length,
  totalPages: items.length ? 1 : 0,
});

beforeEach(() => {
  search = "";
  push.mockReset();
  vi.mocked(listProducts).mockReset();
});
afterEach(cleanup);

describe("ProductCard - giá", () => {
  it("có khuyến mại: hiện giá sau giảm, giá gốc gạch ngang và % giảm", () => {
    const { container } = render(
      <ProductCard product={summary({ salePrice: 8_000_000, discountPercent: 20 })} />,
    );
    expect(container.querySelector("del")?.textContent).toContain("10.000.000");
    expect(screen.getAllByText(/8\.000\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/-20%/).length).toBeGreaterThan(0);
  });

  it("không khuyến mại (null): chỉ hiện giá thường", () => {
    const { container } = render(<ProductCard product={summary()} />);
    expect(container.querySelector("del")).toBeNull();
    expect(screen.getByText(/10\.000\.000/)).toBeInTheDocument();
    expect(screen.queryByText("Chưa có đánh giá")).toBeNull();
  });
});

describe("ProductBuyBox - size", () => {
  const variants = [
    { id: 1, sku: "a", size: "10", stock: 5 },
    { id: 2, sku: "b", size: "12", stock: 0 },
  ];

  it("vô hiệu hóa size hết hàng, size còn hàng chọn được", () => {
    render(<ProductBuyBox product={detail(variants)} />);
    expect(screen.getByRole("radio", { name: "12" })).toBeDisabled();
    const ok = screen.getByRole("radio", { name: "10" });
    expect(ok).toBeEnabled();
    fireEvent.click(ok);
    expect(ok).toBeChecked();
    expect(screen.getByText(/Còn hàng \(5\)/)).toBeInTheDocument();
  });

  it("sản phẩm không có size: không hiện lựa chọn size", () => {
    render(<ProductBuyBox product={detail([{ id: 1, sku: "a", size: "", stock: 2 }])} />);
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText(/Chỉ còn 2 sản phẩm/)).toBeInTheDocument();
  });

  it("hết hàng toàn bộ: khóa nút thêm giỏ", () => {
    render(<ProductBuyBox product={{ ...detail([{ id: 1, sku: "a", size: "", stock: 0 }]), inStock: false }} />);
    expect(screen.getByRole("button", { name: /Thêm vào giỏ hàng/ })).toBeDisabled();
  });
});

describe("ProductListing", () => {
  it("gọi API với query ánh xạ từ URL", async () => {
    search = "category=nhan&sale=1&sort=price_desc&price=5-10tr&page=2";
    vi.mocked(listProducts).mockResolvedValue(page([summary()]));
    render(<ProductListing />);
    await waitFor(() => expect(listProducts).toHaveBeenCalled());
    expect(vi.mocked(listProducts).mock.calls[0][0]).toMatchObject({
      category: "nhan",
      onSale: true,
      sort: "price_desc",
      minPrice: 5_000_000,
      maxPrice: 9_999_999,
      page: 2,
      pageSize: 12,
    });
    expect(await screen.findByText("Nhẫn vàng")).toBeInTheDocument();
  });

  it("empty state khi không có sản phẩm", async () => {
    vi.mocked(listProducts).mockResolvedValue(page([]));
    render(<ProductListing />);
    expect(await screen.findByText("Không tìm thấy sản phẩm")).toBeInTheDocument();
  });

  it("error state có nút thử lại gọi lại API", async () => {
    vi.mocked(listProducts).mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(page([summary()]));
    render(<ProductListing />);
    fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Nhẫn vàng")).toBeInTheDocument();
    expect(listProducts).toHaveBeenCalledTimes(2);
  });
});
