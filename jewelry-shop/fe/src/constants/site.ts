/** Nội dung tĩnh của site khách hàng: menu, liên hệ, chính sách. */
import { BRAND_NAME } from ".";

/** Mục menu tĩnh; các mục danh mục ở giữa lấy từ API (/categories). */
export const NAV_LEAD = [
  { label: "Trang chủ", href: "/" },
  { label: "Trang sức", href: "/products" },
] as const;

export const NAV_TAIL = [
  { label: "Bộ sưu tập", href: "/#bo-suu-tap" },
  { label: "Khuyến mại", href: "/products?sale=1" },
] as const;

// Thông tin liên hệ tạm, thay bằng thông tin thật của cửa hàng.
export const CONTACT = {
  hotline: "1900 6789",
  email: "cskh@lumieregems.vn",
  address: "123 Nguyễn Trãi, Phường Thanh Xuân, Hà Nội",
  hours: "8:30 - 21:00 hằng ngày",
} as const;

export const POLICIES = [
  {
    key: "bao-hanh",
    title: "Bảo hành trọn đời",
    short: "Miễn phí làm sạch, đánh bóng và kiểm tra đá chủ.",
    detail:
      "Mọi sản phẩm được bảo hành chế tác trọn đời. Miễn phí làm sạch, đánh bóng, xi mạ và kiểm tra độ chắc chắn của đá chủ.",
  },
  {
    key: "doi-tra",
    title: "Đổi trả trong 30 ngày",
    short: "Đổi size, đổi mẫu dễ dàng khi sản phẩm còn nguyên vẹn.",
    detail:
      "Hỗ trợ đổi size hoặc đổi mẫu trong 30 ngày kể từ ngày nhận hàng khi sản phẩm còn nguyên vẹn, đầy đủ hóa đơn và giấy chứng nhận.",
  },
  {
    key: "giao-hang",
    title: "Giao hàng toàn quốc",
    short: "Đóng gói cao cấp, giao hàng có bảo hiểm, kiểm tra khi nhận.",
    detail:
      "Giao hàng toàn quốc, đóng gói hộp quà cao cấp, có bảo hiểm vận chuyển. Phí giao hàng tùy theo phương thức vận chuyển bạn chọn.",
  },
] as const;

export const FOOTER_LINKS = {
  shop: [
    { label: "Tất cả trang sức", href: "/products" },
    { label: "Sản phẩm mới", href: "/products?sort=newest" },
    { label: "Bán chạy nhất", href: "/products?sort=bestseller" },
    { label: "Khuyến mại", href: "/products?sale=1" },
    { label: "Bộ sưu tập", href: "/#bo-suu-tap" },
  ],
  support: [
    { label: "Chính sách bảo hành", href: "/pages/chinh-sach-bao-hanh" },
    { label: "Chính sách đổi trả", href: "/pages/chinh-sach-doi-tra" },
    { label: "Chính sách giao hàng", href: "/pages/chinh-sach-giao-hang" },
    { label: "Hỏi đáp", href: "/faq" },
    { label: "Cẩm nang", href: "/articles" },
  ],
} as const;

export const COPYRIGHT = `© ${BRAND_NAME}. Bảo lưu mọi quyền.`;

export const COPYRIGHT_SUFFIX = "Bảo lưu mọi quyền.";
