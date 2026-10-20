import { describe, expect, it } from "vitest";
import { parseCheckoutIds } from "@/store/checkout-store";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "./order";

describe("nhãn trạng thái", () => {
  it("tiếng Việt thống nhất", () => {
    expect(ORDER_STATUS_LABEL).toEqual({
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      preparing: "Đang chuẩn bị hàng",
      shipping: "Đang giao hàng",
      delivered: "Giao hàng thành công",
      cancelled: "Đã hủy",
    });
    expect(PAYMENT_STATUS_LABEL).toEqual({ unpaid: "Chưa thanh toán", paid: "Đã thanh toán" });
  });
});

describe("parseCheckoutIds", () => {
  it("đọc mảng id hợp lệ, bỏ trùng và giá trị lạ", () => {
    expect(parseCheckoutIds("[1,2,2,3]")).toEqual([1, 2, 3]);
    expect(parseCheckoutIds('[1,"a",-1,0,1.5,null]')).toEqual([1]);
  });
  it("dữ liệu hỏng hoặc thiếu thì rỗng", () => {
    expect(parseCheckoutIds(null)).toEqual([]);
    expect(parseCheckoutIds("not json")).toEqual([]);
    expect(parseCheckoutIds('{"a":1}')).toEqual([]);
  });
});
