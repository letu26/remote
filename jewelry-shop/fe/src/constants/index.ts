/** Tên thương hiệu tạm. Đổi ở đây là đổi toàn site (giao diện, tiêu đề, metadata). */
export const BRAND_NAME = "Lumière Gems";
export const BRAND_TAGLINE = "Trang sức đá quý";
export const BRAND_DESCRIPTION = "Trang sức đá quý tinh tế, chế tác thủ công, bảo hành trọn đời.";

export const TOKEN_KEY = "accessToken";

export type Role = "admin" | "user";

export const ROUTES = {
  home: "/",
  products: "/products",
  login: "/login",
  register: "/register",
  logout: "/logout",
  forgotPassword: "/forgot-password",
  verifyOtp: "/verify-otp",
  resetPassword: "/reset-password",
  changePassword: "/change-password",
  unauthorized: "/unauthorized",
  admin: "/admin",
  user: "/user",
  cart: "/cart",
  checkout: "/checkout",
  orders: "/user/orders",
  reviews: "/user/reviews",
  wishlist: "/user/wishlist",
  addresses: "/user/addresses",
} as const;

export const ROLE_HOME: Record<Role, string> = {
  admin: ROUTES.admin,
  user: ROUTES.user,
};

/** Thông báo theo mã lỗi backend (API_CONTRACT.md). */
export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Dữ liệu không hợp lệ",
  INVALID_CREDENTIALS: "Số điện thoại hoặc mật khẩu không đúng",
  TOKEN_EXPIRED: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
  TOKEN_INVALID: "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại",
  UNAUTHORIZED: "Bạn cần đăng nhập để tiếp tục",
  ACCOUNT_LOCKED: "Tài khoản của bạn đã bị khóa",
  FORBIDDEN: "Không có quyền truy cập",
  NOT_FOUND: "Không tìm thấy dữ liệu",
  PHONE_ALREADY_EXISTS: "Số điện thoại đã được sử dụng",
  EMAIL_ALREADY_EXISTS: "Email đã được sử dụng",
  TOKEN_REVOKED: "Phiên đăng nhập đã hết hiệu lực, vui lòng đăng nhập lại",
  OTP_INVALID: "Mã OTP không đúng",
  OTP_EXPIRED: "Mã OTP đã hết hạn, vui lòng gửi lại mã",
  OTP_TOO_MANY_ATTEMPTS: "Bạn đã nhập sai quá nhiều lần, vui lòng gửi lại mã mới",
  OTP_RATE_LIMITED: "Vui lòng đợi một lát trước khi yêu cầu mã mới",
  RESET_TOKEN_INVALID: "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn, vui lòng thử lại",
  INTERNAL_ERROR: "Hệ thống đang gặp sự cố, vui lòng thử lại sau",
  NETWORK_ERROR: "Không thể kết nối tới máy chủ, vui lòng kiểm tra mạng",
  TIMEOUT: "Máy chủ phản hồi quá lâu, vui lòng thử lại",
  UNKNOWN: "Đã có lỗi xảy ra, vui lòng thử lại",
};

/** Mã lỗi gắn vào một trường cụ thể của form. */
export const ERROR_CODE_FIELD: Record<string, string> = {
  PHONE_ALREADY_EXISTS: "phone",
  EMAIL_ALREADY_EXISTS: "email",
};
