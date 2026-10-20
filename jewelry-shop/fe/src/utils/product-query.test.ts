import { describe, expect, it } from "vitest";
import { countActiveFilters, parseProductQuery, serializeProductQuery, toApiParams } from "./product-query";

const parse = (qs: string) => parseProductQuery(new URLSearchParams(qs));

describe("product-query", () => {
  it("đọc bộ lọc từ URL và bỏ giá trị không hợp lệ", () => {
    const q = parse(
      "q=nhan&category=nhan-cuoi&collection=co-dien&material=3&gemstone=1,2,x,-4&targetGroup=women&price=5-10tr&sale=1&instock=1&sort=price_asc&page=3",
    );
    expect(q).toEqual({
      q: "nhan",
      category: "nhan-cuoi",
      collection: "co-dien",
      material: 3,
      gemstone: [1, 2],
      targetGroup: "women",
      price: "5-10tr",
      sale: true,
      inStock: true,
      sort: "price_asc",
      page: 3,
    });
    const bad = parse("targetGroup=robot&price=xx&sort=oldest&page=0&material=abc");
    expect(bad.targetGroup).toBeUndefined();
    expect(bad.price).toBeUndefined();
    expect(bad.sort).toBeUndefined();
    expect(bad.page).toBeUndefined();
    expect(bad.material).toBeUndefined();
  });

  it("ghi URL rồi đọc lại ra cùng bộ lọc (khứ hồi)", () => {
    const q = parse("category=a&gemstone=2,5&sort=bestseller&page=2&sale=1");
    expect(parse(serializeProductQuery(q))).toEqual(q);
  });

  it("không ghi sort mặc định và page 1 lên URL", () => {
    expect(serializeProductQuery({ sort: "newest", page: 1 })).toBe("");
  });

  it("ánh xạ sang query của GET /products", () => {
    const q = parse("category=nhan&collection=c1&material=2&gemstone=1,3&targetGroup=men&price=5-10tr&sale=1&instock=1&sort=rating&page=2&q=vang");
    expect(toApiParams(q, 12)).toEqual({
      q: "vang",
      category: "nhan",
      collection: "c1",
      material: 2,
      gemstone: "1,3",
      targetGroup: "men",
      minPrice: 5_000_000,
      maxPrice: 9_999_999,
      inStock: true,
      onSale: true,
      sort: "rating",
      page: 2,
      pageSize: 12,
    });
  });

  it("khoảng giá mở một đầu và bộ lọc rỗng", () => {
    expect(toApiParams(parse("price=tren-50tr"))).toMatchObject({ minPrice: 50_000_000, maxPrice: undefined });
    expect(toApiParams(parse("price=duoi-5tr"))).toMatchObject({ minPrice: undefined, maxPrice: 4_999_999 });
    const empty = toApiParams({});
    expect(empty.onSale).toBeUndefined();
    expect(empty.inStock).toBeUndefined();
    expect(empty.gemstone).toBeUndefined();
  });

  it("đếm bộ lọc đang bật", () => {
    expect(countActiveFilters(parse("category=a&gemstone=1,2&sale=1&sort=price_asc"))).toBe(4);
  });
});
