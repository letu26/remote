# Tài liệu chi tiết từng chức năng: Lumière Gems

Tài liệu mô tả từng chức năng của hệ thống theo cùng một khuôn: **mục đích, người dùng, các bước thao tác, luồng xử lý trong hệ thống, quy tắc nghiệp vụ, API, dữ liệu liên quan, các trường hợp lỗi**. Nội dung dựa trên mã nguồn hiện tại (be: NestJS, fe: Next.js). Đường dẫn API đều có tiền tố `/api`.

Danh sách chức năng:

1. [Đăng ký, đăng nhập, phiên làm việc](#1-đăng-ký-đăng-nhập-phiên-làm-việc)
2. [Quên mật khẩu bằng OTP](#2-quên-mật-khẩu-bằng-otp)
3. [Tài khoản cá nhân và sổ địa chỉ](#3-tài-khoản-cá-nhân-và-sổ-địa-chỉ)
4. [Duyệt sản phẩm, giá và khuyến mại](#4-duyệt-sản-phẩm-giá-và-khuyến-mại)
5. [Giỏ hàng](#5-giỏ-hàng)
6. [Yêu thích](#6-yêu-thích)
7. [Đặt hàng](#7-đặt-hàng)
8. [Vòng đời và quản lý đơn hàng](#8-vòng-đời-và-quản-lý-đơn-hàng)
9. [Thanh toán](#9-thanh-toán) (COD, chuyển khoản, ZaloPay)
10. [Gửi email tự động](#10-gửi-email-tự-động)
11. [Đánh giá sản phẩm](#11-đánh-giá-sản-phẩm)
12. [Quản lý sản phẩm, ảnh, tồn kho (admin)](#12-quản-lý-sản-phẩm-ảnh-tồn-kho-admin)
13. [Khuyến mại (admin)](#13-khuyến-mại-admin)
14. [Quản lý người dùng (admin)](#14-quản-lý-người-dùng-admin)
15. [Thống kê và tổng quan (admin)](#15-thống-kê-và-tổng-quan-admin)
16. [Nội dung (CMS), menu, banner](#16-nội-dung-cms-menu-banner)
17. [Chatbot](#17-chatbot)
18. [Cơ chế dùng chung](#18-cơ-chế-dùng-chung)

---

## 1. Đăng ký, đăng nhập, phiên làm việc

**Người dùng:** khách chưa có tài khoản, người dùng đã đăng ký, admin.

**Các bước**
1. **Đăng ký** (`/register`): nhập họ tên, email, số điện thoại (10 số, bắt đầu bằng 0), mật khẩu (tối thiểu 6 ký tự).
2. **Đăng nhập** (`/login`): nhập **số điện thoại** và mật khẩu.
3. Hệ thống đưa về trang theo vai trò: `admin` vào `/admin`, `user` vào `/user`. Nếu bị chuyển từ một trang cần đăng nhập thì quay lại trang đó (tham số `?redirect=`, chỉ nhận đường dẫn nội bộ).
4. **Đăng xuất** (`/logout`).

**Luồng xử lý**
- `POST /auth/register`: tạo người dùng, kiểm tra trùng email và số điện thoại (trùng trả `409`). Mật khẩu băm bằng **bcrypt** rồi mới lưu. Vai trò mặc định `user`.
- `POST /auth/login`: tìm theo số điện thoại, so mật khẩu bằng bcrypt. Để không lộ tài khoản có tồn tại hay không, hệ thống luôn so với một băm giả khi không tìm thấy, và trả cùng một thông báo `INVALID_CREDENTIALS` ("Số điện thoại hoặc mật khẩu không đúng"). Tài khoản bị khóa trả `403 ACCOUNT_LOCKED`.
- Đăng nhập đúng thì ký **JWT** chứa `sub`, `id`, `email`, `role`, mã duy nhất `jti` và thời điểm phát hành, hạn **1 ngày** (`JWT_EXPIRES_IN`).
- Fe lưu token ở **`sessionStorage`** (khóa `accessToken`): mỗi tab đăng nhập riêng, đóng tab là mất phiên.
- Mỗi request kèm `Authorization: Bearer <token>`. Be kiểm tra chữ ký và hạn, kiểm tra tài khoản còn hoạt động, và kiểm tra token có nằm trong **blacklist** (bảng `token_blacklist`) không.
- `POST /auth/logout`: đưa `jti` của token vào blacklist đến lúc token hết hạn.
- Đổi mật khẩu, đặt lại mật khẩu, đổi vai trò, khóa tài khoản: **vô hiệu mọi token cũ** của tài khoản đó.

**Lỗi thường gặp:** `401` chưa đăng nhập, sai hoặc hết hạn token (fe xóa token và về trang đăng nhập, không lặp vô hạn); `403` không đủ quyền (fe hiện trang "Không có quyền truy cập"); `409` trùng email hoặc số điện thoại.

**Dữ liệu:** `users` (`passwordHash`, `role` = `admin`/`user`, `status` = `active`/`locked`), `token_blacklist`.

---

## 2. Quên mật khẩu bằng OTP

**Người dùng:** người đã có tài khoản nhưng quên mật khẩu.

**Các bước**
1. Ở trang đăng nhập bấm **Quên mật khẩu** (`/forgot-password`), nhập **email** của tài khoản.
2. Mở hộp thư (kiểm tra cả mục Spam), lấy **mã OTP 6 số**.
3. Ở trang `/verify-otp` nhập OTP.
4. Ở trang `/reset-password` nhập mật khẩu mới (tối thiểu 6 ký tự). Hoàn tất, đăng nhập lại.

**Luồng xử lý** (`PasswordRecoveryService`)
1. `POST /auth/forgot-password` (email):
   - Áp **thời gian chờ 60 giây** cho mỗi email (`OTP_RESEND_COOLDOWN_SECONDS`), áp cho mọi email để không lộ email có tồn tại hay không. Vi phạm trả `429 OTP_RATE_LIMITED` kèm `retryAfterSeconds`.
   - Nếu email thuộc tài khoản đang hoạt động: sinh OTP 6 số, lưu vào **Redis** dạng băm `HMAC-SHA256(OTP_SECRET, email:otp)` với thời hạn **120 giây**, rồi gửi email OTP (chạy nền, xem mục 10).
   - Luôn trả cùng một thông báo "Nếu email tồn tại, chúng tôi đã gửi mã OTP".
2. `POST /auth/verify-otp` (email, otp):
   - So băm OTP nhập vào với băm trong Redis bằng phép so sánh thời gian cố định.
   - Sai: tăng bộ đếm; sai tối đa **5 lần** (`OTP_MAX_ATTEMPTS`) thì khóa, trả `OTP_TOO_MANY_ATTEMPTS`. Mỗi lần sai báo còn bao nhiêu lần.
   - Hết hạn hoặc chưa yêu cầu: `OTP_EXPIRED`.
   - Đúng: OTP bị **tiêu thụ** (chỉ một yêu cầu đúng được đổi), cấp **mã đặt lại** dùng một lần lưu ở Redis, hiệu lực **10 phút** (`RESET_TICKET_TTL_SECONDS`).
3. `POST /auth/reset-password` (resetToken, newPassword): tiêu thụ mã đặt lại, đặt mật khẩu mới và **vô hiệu mọi token cũ**. Mã sai, hết hạn hoặc đã dùng: `RESET_TOKEN_INVALID`.

**Ghi chú an toàn:** OTP không được ghi vào log. Fe chuyển bước bằng một "luồng đặt lại" (`reset-flow`) lưu tạm, quay lại trang trước khi có dữ liệu sẽ đưa về `/forgot-password`.

**Cần cấu hình:** `MAIL_*` trong `be/.env` (xem mục 10), Redis chạy.

---

## 3. Tài khoản cá nhân và sổ địa chỉ

**Hồ sơ** (`/user`): xem và sửa họ tên, email, số điện thoại (`GET/PATCH /users/me`). Email và số điện thoại không được trùng tài khoản khác; trùng trả `409`. Khi lưu, lời chào trên header ("Chào {tên}") cập nhật ngay.

**Đổi mật khẩu** (`/change-password`): nhập mật khẩu hiện tại và mật khẩu mới. Sai mật khẩu hiện tại thì báo lỗi ở trường đó. Thành công thì **mọi token cũ bị vô hiệu**, phải đăng nhập lại.

**Sổ địa chỉ** (`/user/addresses`, `GET/POST/PATCH/DELETE /users/me/addresses`)
- Mỗi địa chỉ gồm người nhận, số điện thoại, **tỉnh/thành**, **xã/phường**, chi tiết (số nhà, đường).
- Địa danh theo đơn vị hành chính **sau sáp nhập 01/07/2025, chỉ 2 cấp** (không còn quận/huyện): bảng `provinces` (34) và `wards` (khoảng 3.321). Be kiểm tra xã/phường thuộc đúng tỉnh/thành đã chọn, sai thì `INVALID_LOCATION`.
- **Tối đa 10 địa chỉ** mỗi tài khoản (quá thì `ADDRESS_LIMIT_EXCEEDED`).
- Luôn có **đúng một địa chỉ mặc định**. Muốn đổi mặc định phải đặt địa chỉ khác làm mặc định (`PUT .../:id/default`); đặt `isDefault: false` cho địa chỉ hiện là mặc định bị bỏ qua.
- Dữ liệu địa danh được cache ở Redis.

---

## 4. Duyệt sản phẩm, giá và khuyến mại

**Người dùng:** mọi khách, không cần đăng nhập.

**Các bước**
1. Xem trang chủ (banner, danh mục, các khối sản phẩm, bộ sưu tập, cẩm nang) hoặc vào **Trang sức** (`/products`).
2. Lọc theo loại, khoảng giá, chất liệu, loại đá quý, đối tượng (nam, nữ, unisex, trẻ em), bộ sưu tập, đang khuyến mại, còn hàng; sắp xếp mới nhất, giá tăng/giảm, bán chạy, đánh giá cao. Bộ lọc ghi lên URL nên chia sẻ và quay lại được.
3. Tìm kiếm từ ô trên header (gợi ý khi gõ, có debounce 500 ms) hoặc `?q=`.
4. Bấm sản phẩm vào `/products/<slug>`: ảnh, chọn size, số lượng, thông số, đá quý, đánh giá.

**Luồng xử lý**
- `GET /products` lọc, sắp xếp và phân trang ở phía be; `GET /products/:slug` chi tiết.
- Sản phẩm **ẩn** hoặc thuộc **danh mục ẩn** (kể cả khi tổ tiên của danh mục bị ẩn) coi như không tồn tại với khách (`404`).
- **Giá khuyến mại không lưu trên sản phẩm.** Be tính tại thời điểm xem: lấy các khuyến mại đang bật và đang trong khoảng thời gian, nếu nhiều thì lấy **mức giảm cao nhất**; `giá bán = làm tròn(giá × (100 − %) / 100)`.
- Một sản phẩm có nhiều **biến thể** (size) với tồn kho riêng. Một sản phẩm có thể có nhiều **đá quý** (số lượng, carat, màu, độ tinh khiết, kiểu cắt).
- Điểm và số lượt đánh giá chỉ tính đánh giá **không bị ẩn**.
- Danh mục, chất liệu, loại đá, bộ sưu tập được cache ở Redis (5 phút) và có API lấy danh sách để dựng bộ lọc (`GET /categories`, `/materials`, `/gemstones`, `/collections`).

---

## 5. Giỏ hàng

**Người dùng:** đã đăng nhập.

**Các bước:** ở trang sản phẩm bấm **Thêm vào giỏ hàng** (sản phẩm nhiều size thì chọn size trước; bấm nhanh ở thẻ sản phẩm chỉ thêm thẳng nếu sản phẩm có một biến thể). Vào `/cart` để đổi số lượng, xóa, tích chọn dòng cần mua và bấm **Thanh toán**.

**Luồng xử lý** (`CartService`, `/cart`)
- `GET /cart` luôn trả **giá hiện tại** (đã gồm khuyến mại), tổng tạm tính và cờ `hasIssues`.
- `POST /cart/items` thêm một biến thể; trong **một giao dịch có khóa** để hai yêu cầu song song không vượt tồn kho.
- Quy tắc:
  - Mỗi dòng **tối đa 10 sản phẩm** (`QUANTITY_LIMIT_EXCEEDED`).
  - Số lượng trong giỏ **không vượt tồn kho** (`INSUFFICIENT_STOCK`, kèm số còn lại và số đang có trong giỏ).
  - Sản phẩm, biến thể hoặc danh mục đã ngừng bán không thêm được (`ITEM_UNAVAILABLE`).
  - **Giỏ hàng không giữ chỗ tồn kho**: kho chỉ bị trừ khi đặt hàng.
- Mỗi dòng có trạng thái `issue`: `UNAVAILABLE` (ngừng bán), `OUT_OF_STOCK` (hết hàng), `INSUFFICIENT_STOCK` (không đủ). Dòng có lỗi không được tính vào tạm tính.
- `PATCH /cart/items/:id` đổi số lượng, `DELETE /cart/items/:id` hoặc xóa nhiều dòng.
- Số lượng sản phẩm trong giỏ hiện trên biểu tượng giỏ hàng ở header.

---

## 6. Yêu thích

- Biểu tượng trái tim ở thẻ sản phẩm và trang chi tiết: bấm để thêm hoặc bỏ. Cập nhật ngay trên giao diện (lạc quan) và hoàn lại nếu be báo lỗi.
- `GET /wishlist` (có phân trang), `GET /wishlist/ids` (danh sách mã sản phẩm đã thích, tải một lần khi đăng nhập), `POST /wishlist`, `DELETE /wishlist/:productId`.
- Thêm một sản phẩm đã có thì không lỗi (trùng bị bỏ qua). Sản phẩm ẩn hoặc thuộc danh mục ẩn coi như không có.
- Khóa duy nhất `(userId, productId)`. Danh sách yêu thích xem ở trang `/user/wishlist` (menu **Bộ sưu tập** trên header dẫn tới đây).

---

## 7. Đặt hàng

**Người dùng:** đã đăng nhập, có ít nhất một dòng đã chọn trong giỏ và một địa chỉ.

**Các bước**
1. Ở `/cart` chọn dòng → **Thanh toán** (`/checkout`).
2. Trang thanh toán gọi **xem trước** để hiện sản phẩm, giá, phí vận chuyển, tổng.
3. Chọn **địa chỉ**, **phương thức vận chuyển**, **phương thức thanh toán**, nhập ghi chú (tùy chọn).
4. Bấm **Đặt hàng**. Thành công chuyển sang `/user/orders/<mã đơn>?placed=1`.

**Luồng xử lý**
1. `POST /orders/preview` (`itemIds`, `shippingMethodId`): tính giá bằng **một nguồn duy nhất** (`OrderPricingService`), dùng cho cả xem trước và đặt thật. Giá luôn lấy từ giá hiện tại ở be, **không tin giá từ client**. Trả kèm `issues` cho dòng lỗi (hết hàng, ngừng bán).
2. `POST /orders` (kèm header **`Idempotency-Key`**, `addressId`, `shippingMethodId`, `paymentMethod`, `note`, `expectedTotal`):
   - **Chống đặt trùng:** khóa lưu ở Redis (10 phút). Gửi lại cùng khóa thì trả lại **đơn cũ** (HTTP 200, không tạo thêm); hai yêu cầu cùng khóa chạy cùng lúc thì một yêu cầu nhận `REQUEST_IN_PROGRESS` (`409`). Thiếu hoặc sai định dạng khóa trả `400`.
   - Lấy địa chỉ của chính khách, tính lại giá.
   - Kiểm tra dòng: ngừng bán trả `ITEM_UNAVAILABLE`; thiếu hàng trả `INSUFFICIENT_STOCK` kèm danh sách thiếu.
   - So `expectedTotal` (tổng khách đã thấy) với tổng tính lại: khác thì trả `PRICE_CHANGED` kèm tổng mới để khách xem lại.
   - Trong **một giao dịch DB**: khóa các dòng giỏ và kiểm tra giỏ chưa đổi; **trừ tồn kho** bằng câu lệnh có điều kiện `stock >= số lượng` theo thứ tự biến thể tăng dần (tránh deadlock); tạo đơn với mã dạng `LGyyyyMMdd-xxxxxx` (trùng mã thì thử mã khác); tạo các dòng đơn lưu **bản sao** tên, mã, ảnh, size, giá, số lượng; ghi lịch sử "Đặt hàng"; xóa các dòng đã mua khỏi giỏ.
3. Đơn mới ở trạng thái **Chờ xác nhận**, thanh toán **chưa thanh toán**.

**Dữ liệu:** `orders` (bản sao địa chỉ nhận, tên phương thức vận chuyển, tạm tính, phí, tổng), `order_items`, `order_status_history`.

---

## 8. Vòng đời và quản lý đơn hàng

**Trạng thái:** Chờ xác nhận → Đã xác nhận → Đang chuẩn bị hàng → Đang giao hàng → Giao hàng thành công; hoặc **Đã hủy**.

**Quy tắc chuyển trạng thái** (`order-status.rules.ts`)
- Chỉ **admin** chuyển trạng thái, **từng bước một**, không nhảy cóc. Sai bước trả `409 INVALID_STATUS_TRANSITION`.
- **Khách chỉ hủy được khi đơn còn "Chờ xác nhận".** Quá bước đó trả `ORDER_NOT_CANCELLABLE`.
- **Admin hủy được** ở Chờ xác nhận, Đã xác nhận, Đang chuẩn bị hàng; không hủy được khi đã giao.
- Mọi thao tác chạy trong giao dịch có **khóa dòng đơn** và kiểm tra lại trạng thái trước khi ghi (tránh hai người cùng sửa).
- **Hủy đơn:** hoàn tồn kho đúng một lần, ghi lý do. **Giao thành công:** tăng số đã bán của sản phẩm; đơn COD tự chuyển "đã thanh toán".
- Mỗi thay đổi ghi một dòng **lịch sử** (trạng thái, người đổi, ghi chú), hiện ở khối Tiến trình.

**Khách:** `/user/orders` có bộ lọc theo trạng thái, xem tóm tắt; `/user/orders/<mã>` xem chi tiết, tiến trình, thanh toán; nút **Hủy đơn** khi được phép.

**Admin** (`/admin/orders`)
1. Tìm theo mã đơn, tên hoặc số điện thoại người nhận; lọc theo trạng thái, thanh toán, khoảng ngày, theo người dùng.
2. Mở chi tiết đơn (`/admin/orders/<id>`): người dùng, người nhận, sản phẩm, thanh toán, lịch sử.
3. Bấm nút chuyển trạng thái kế tiếp (Xác nhận đơn, rồi chuẩn bị hàng, giao hàng, giao thành công) hoặc **Hủy đơn** (nhập lý do).
4. **In hóa đơn** (`/admin/orders/<id>/invoice`), có hotline và địa chỉ cửa hàng.
- API: `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status`, `PATCH /admin/orders/:id/payment`.

---

## 9. Thanh toán

Phương thức chọn khi đặt hàng (`paymentMethod`): `cod`, `bank_transfer`, `zalopay`. Trạng thái thanh toán của đơn: `unpaid` hoặc `paid`. Quy tắc tập trung ở module `payments` để cắm thêm cổng sau này.

### 9.1 COD (trả khi nhận hàng)
- Đơn tạo ra chưa thanh toán. Khi admin chuyển đơn sang **Giao hàng thành công**, hệ thống tự đặt **Đã thanh toán**, ghi thời điểm.

### 9.2 Chuyển khoản ngân hàng
1. Khách chọn "Chuyển khoản ngân hàng" và đặt hàng.
2. Trang đơn hiện khung **Thông tin chuyển khoản**: ngân hàng, số tài khoản, chủ tài khoản, số tiền, nội dung chuyển khoản (chứa mã đơn). Có nút sao chép.
3. Khách chuyển khoản.
4. **Admin kiểm tra tiền về** rồi vào chi tiết đơn bấm **Xác nhận đã thanh toán** (có thể **hủy xác nhận**). Chỉ áp dụng cho đơn chuyển khoản chưa hủy; đơn khác trả `409`. Ghi vào lịch sử đơn.
- Thông tin tài khoản do admin cấu hình ở **Cài đặt → Chuyển khoản**; mẫu nội dung phải chứa `{orderCode}` để thay bằng mã đơn. Mặc định là dữ liệu mẫu.

### 9.3 ZaloPay (quét mã QR, tự động)

**Chuẩn bị:** khóa `ZLP_APP_ID`, `ZLP_KEY1`, `ZLP_KEY2` trong `be/.env` (khóa dùng chung chỉ để thử). `ZLP_CALLBACK_URL` là địa chỉ công khai nhận thông báo (qua Cloudflare Tunnel khi chạy local, xem README mục 8). Khách cài app **ZaloPay Sandbox**, đăng ký tài khoản thử (mã xác thực cố định `111111`) và nạp tiền thử.

**Các bước của khách**
1. Ở trang thanh toán chọn **Quét mã QR ZaloPay**, bấm **Đặt hàng**.
2. Trang đơn hiện khung **Thanh toán bằng ZaloPay** gồm mã QR, số tiền và đếm ngược 15 phút.
3. Mở app ZaloPay Sandbox, chọn quét mã, quét QR, xác nhận thanh toán.
4. Trang đơn tự chuyển sang **Đã thanh toán** trong vài giây; khung QR biến mất, tiến trình ghi "ZaloPay: đã nhận thanh toán".
5. Mã hết hạn thì bấm **Tạo mã mới**.

**Luồng xử lý chi tiết**
1. **Tạo mã** `POST /payments/zalopay/orders/:code` (chủ đơn):
   - Kiểm tra đơn thuộc khách, đúng phương thức ZaloPay, chưa thanh toán, chưa hủy (sai thì `409`); chưa cấu hình khóa thì `503`.
   - Còn mã chưa hết hạn (còn trên 1 phút) thì **trả lại mã cũ**.
   - Nếu không: sinh `app_trans_id = yymmdd_<mã đơn>_<lần thử>` (tối đa 40 ký tự, ngày theo giờ Việt Nam), ký `mac = HMAC-SHA256(key1, app_id|app_trans_id|app_user|amount|app_time|embed_data|item)` và gọi `POST {ZLP_ENDPOINT}create` của ZaloPay. Tham số gồm `callback_url` nếu đã cấu hình.
   - ZaloPay trả `return_code = 1` kèm `order_url` thì lưu giao dịch vào `zalopay_transactions` (trạng thái `pending`, hết hạn sau **15 phút**) và trả `{ appTransId, orderUrl, amount, expiresAt }`. Trùng `app_trans_id` (mã `-68`) thì tăng "lần thử" và tạo lại một lần. Lỗi khác trả `502 PAYMENT_GATEWAY_ERROR`.
2. **Hiện QR:** fe dựng mã QR từ `orderUrl`, đếm ngược, và hỏi trạng thái mỗi **4 giây**.
3. **Callback** `POST /payments/zalopay/callback` (công khai, không có JWT):
   - Thân `{ data, mac, type }`. Be tính `HMAC-SHA256(key2, data)` và so với `mac` bằng phép so sánh thời gian cố định. Sai thì trả `{ return_code: -1 }`.
   - Kiểm tra `app_id`, tìm giao dịch theo `app_trans_id` (không thấy: `2`), **so số tiền** `amount` với số tiền giao dịch (lệch: `2`, ghi log lỗi).
   - Ghi nhận trong **một giao dịch DB**: khóa dòng giao dịch rồi khóa dòng đơn; nếu giao dịch đã `paid` thì trả `already_paid` (không làm gì); nếu chưa thì đặt giao dịch `paid` (kèm mã giao dịch ZaloPay, kênh, thời điểm, dữ liệu gốc), đặt đơn `paymentStatus = paid` và `paidAt`, ghi lịch sử đơn "ZaloPay: đã nhận thanh toán".
   - Phản hồi luôn HTTP 200 với `return_code`: `1` thành công (kể cả callback trùng), `-1` sai chữ ký, `2` dữ liệu hoặc số tiền không khớp, `0` lỗi tạm (ZaloPay sẽ gọi lại tối đa 3 lần).
4. **Dự phòng khi mất callback** `GET /payments/zalopay/orders/:code/status`: mỗi lần được hỏi (tối đa một lần mỗi 3 giây cho mỗi giao dịch), be chủ động gọi `POST {ZLP_ENDPOINT}query` của ZaloPay (ký `HMAC(key1, app_id|app_trans_id|key1)`). Nếu ZaloPay báo thành công thì ghi nhận như callback (dòng lịch sử ghi thêm "xác nhận qua truy vấn"). Lỗi khi hỏi chỉ ghi log và coi như chưa có kết quả.
5. **Hết hạn:** quá 15 phút mà chưa trả thì giao dịch bị đánh dấu `failed` và trạng thái trả về là `expired`; khách tạo mã mới.
6. Sau khi ghi nhận lần đầu, hệ thống phát sự kiện `order.paid` để gửi email cho admin (mục 10). Chỉ phát **một lần** dù callback gửi nhiều lần.

**Trạng thái trả về của API `status`:** `paid`, `pending` (kèm `expiresAt`), `expired`, `none` (chưa có mã).

**Điểm cần biết**
- Sau khi thanh toán xong, trạng thái **giao hàng vẫn là "Chờ xác nhận"** cho tới khi admin xác nhận đơn.
- Đơn ZaloPay đã thanh toán rồi bị hủy: chỉ ghi nhận hủy, **không hoàn tiền** (hoàn tiền xử lý ngoài hệ thống; chưa tích hợp hoàn tiền ZaloPay).
- Khóa dùng chung chỉ dành cho sandbox, không dùng cho tiền thật.

**Dữ liệu:** `zalopay_transactions` (`orderId`, `appTransId` duy nhất, `amount`, `status` pending/paid/failed, `orderUrl`, `expiresAt`, `zpTransId`, `channel`, `paidAt`, `callbackData`), `orders.paymentMethod` có thêm `zalopay`. SQL: `be/database/changes/009_zalopay.sql`.

---

## 10. Gửi email tự động

**Hạ tầng:** `MailService` dùng Nodemailer qua SMTP (Gmail, cổng 587). Cấu hình: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD` (**mật khẩu ứng dụng** 16 ký tự, cần bật xác minh 2 bước), `MAIL_FROM` (tên và địa chỉ người gửi). Email là HTML dạng bảng với CSS nội tuyến (hiển thị đúng trên Gmail, Outlook, điện thoại) kèm bản văn bản thuần. Gửi **bất đồng bộ**: lỗi gửi chỉ ghi log, không bao giờ làm hỏng nghiệp vụ gọi nó, và nội dung nhạy cảm như OTP không bị ghi log.

**Ba loại email**

| Email | Khi nào | Gửi cho | Nội dung chính |
|---|---|---|---|
| **OTP đặt lại mật khẩu** | Khách yêu cầu quên mật khẩu (mục 2) | Chủ tài khoản | Mã OTP 6 số trong các ô riêng, thời hạn (2 phút), cảnh báo bảo mật |
| **Đơn đã thanh toán, cần phê duyệt** | ZaloPay xác nhận thanh toán một đơn lần đầu (mục 9.3) | **Tất cả admin đang hoạt động** (mỗi người một email) | Nhãn "ĐÃ THANH TOÁN", mã đơn, tổng tiền, tên và số điện thoại khách, sản phẩm, nút **Xem và phê duyệt đơn** tới `/admin/orders/<id>` |
| **Đơn đã giao thành công** | Admin chuyển đơn sang "Giao hàng thành công" (mục 8) | **Khách** của đơn | Cảm ơn, mã đơn, tổng tiền, sản phẩm, nút **Xem đơn và đánh giá sản phẩm** tới `/user/orders/<mã>` |

**Cách gửi hai email thông báo bằng aspect (AOP)** (theo quy ước "tác vụ phụ chạy bất đồng bộ bằng aspect")
- Decorator **`@PublishAfter(sự kiện, hàm dựng dữ liệu)`** (`be/src/aspects/publish-after.decorator.ts`) gắn lên phương thức nghiệp vụ. **Chỉ khi phương thức chạy thành công**, aspect mới phát sự kiện; nghiệp vụ ném lỗi thì không phát gì. Hàm dựng dữ liệu có thể trả `null` để bỏ qua lần gọi đó.
- Hai điểm đã gắn:
  1. `ZaloPayService.settlePayment` phát `order.paid` đúng một lần ở lần ghi nhận đầu tiên (kết quả `settled`); callback trùng (`already_paid`) không phát.
  2. `OrderAdminService.updateStatus` phát `order.delivered` khi trạng thái mới là "Giao hàng thành công".
- **Kênh sự kiện** (`be/src/aspects/domain-events.ts`): người nghe chạy **tách khỏi luồng nghiệp vụ** (sau khi nghiệp vụ đã trả kết quả), lỗi của người nghe bị bắt và ghi log.
- `NotificationsModule` có `OrderMailListener` nghe hai sự kiện: `order.paid` lấy danh sách admin hoạt động và thông tin đơn rồi gửi; `order.delivered` lấy email khách (bỏ qua nếu tài khoản khóa hoặc không có email) rồi gửi. Đường dẫn trong email dùng `FRONTEND_URL`.
- **Thêm thông báo mới:** khai báo tên sự kiện trong `domain-events.ts`, gắn `@PublishAfter` vào nghiệp vụ, thêm phương thức gửi trong `MailService` và người nghe trong `NotificationsModule`.

**Lưu ý vận hành**
- Phải đặt `FRONTEND_URL` đúng địa chỉ thật khi triển khai, nếu không nút trong email trỏ về `localhost`.
- Địa chỉ email giả (như `admin@example.com` của dữ liệu mẫu) sẽ làm Gmail trả thư báo lỗi.
- Hiện email báo admin chỉ có cho đơn ZaloPay; email "đã giao" áp dụng cho mọi đơn.

---

## 11. Đánh giá sản phẩm

**Người dùng:** khách đã mua và nhận hàng; admin kiểm duyệt.

**Các bước của khách**
1. Đơn phải ở **Giao hàng thành công**.
2. Ở chi tiết đơn bấm **Đánh giá** dưới sản phẩm (hoặc vào trang sản phẩm, mục đánh giá).
3. Chọn 1 đến 5 sao, nhập nhận xét (tùy chọn), gửi.
4. Xem, sửa, xóa đánh giá ở `/user/reviews`.

**Quy tắc** (`ReviewService`)
- Chỉ người có đơn **đã giao** chứa sản phẩm đó mới đánh giá được (`REVIEW_NOT_ALLOWED`, `403`).
- **Mỗi khách một đánh giá cho mỗi sản phẩm** (khóa duy nhất `(userId, productId)`); gửi trùng hoặc bấm đúp trả `REVIEW_ALREADY_EXISTS`.
- Điểm 1 đến 5, nhận xét tối đa 1000 ký tự. Đánh giá gắn với dòng đơn đã mua (`orderItemId`).
- Khách sửa hoặc xóa **đánh giá của mình**. Đánh giá đang **bị ẩn** bởi admin thì khách chưa sửa được (`REVIEW_HIDDEN`).
- Công khai chỉ hiện tên người đánh giá đã **che bớt**. Có tóm tắt: điểm trung bình, tổng số, phân bố từng sao, và lọc theo số sao.
- API: `GET /products/:slug/reviews`, `GET /products/:slug/my-review` (cho biết đủ điều kiện hay chưa và lý do), `POST /products/:slug/reviews`, `PATCH/DELETE /reviews/:id`, `GET /reviews/me`.

**Admin** (`/admin/reviews`): xem danh sách, **ẩn hoặc hiện** đánh giá (không xóa). Đánh giá ẩn không tính vào điểm và số lượt của sản phẩm; điểm cập nhật cùng giao dịch.

---

## 12. Quản lý sản phẩm, ảnh, tồn kho (admin)

**Các bước** (Kho hàng → Sản phẩm)
1. **Thêm sản phẩm:** mã (duy nhất), tên, slug (để trống thì tự sinh), mô tả, danh mục, chất liệu, bộ sưu tập, đối tượng, trọng lượng, giá bán.
2. Thêm **biến thể** (mã SKU duy nhất, size, tồn kho) và **đá quý** (loại, số lượng, carat, màu, độ tinh khiết, kiểu cắt).
3. Lưu, rồi tải **ảnh**.
4. Bật hoặc tắt **Hiển thị** và **Nổi bật**; **Ẩn/Hiện** nhanh từ danh sách; **Sửa tồn kho** từng biến thể.
5. **Xóa sản phẩm.**

**Quy tắc**
- Mã sản phẩm, SKU và slug không được trùng (`PRODUCT_CODE_ALREADY_EXISTS`, `SKU_ALREADY_EXISTS`, `SLUG_ALREADY_EXISTS`). Danh mục, chất liệu, bộ sưu tập, loại đá được tham chiếu phải tồn tại.
- Tồn kho lưu theo biến thể, có cột `version` cho **khóa lạc quan** khi trừ kho.
- **Không xóa được sản phẩm đã nằm trong đơn hàng** (`RESOURCE_IN_USE`): hãy **ẩn** thay vì xóa. Xóa sản phẩm chưa có đơn thì xóa luôn các ảnh trên Cloudinary.
- **Ảnh:** tối đa **10 ảnh** mỗi sản phẩm, mỗi ảnh tối đa **5 MB**, kiểm tra **loại file thật** bằng nội dung (không tin đuôi file hay `Content-Type`). Tải lên **Cloudinary** (`jewelry-shop/products/<id>`), lưu cả địa chỉ ảnh và mã ảnh để xóa sau. Chọn ảnh đại diện, sắp xếp thứ tự, xóa từng ảnh. Chưa cấu hình Cloudinary thì trả `UPLOAD_NOT_CONFIGURED`.
- Danh mục có thể lồng nhau; danh mục ẩn kéo theo danh mục con và sản phẩm bên trong không hiện cho khách. Danh mục, chất liệu, loại đá, bộ sưu tập chỉ xóa được khi không còn sản phẩm dùng (`RESOURCE_IN_USE`).
- API: `/admin/products` (CRUD, `PATCH :id/variants/:variantId/stock`, `:id/images`), `/admin/categories`, `/admin/materials`, `/admin/gemstones`, `/admin/collections`.

---

## 13. Khuyến mại (admin)

**Các bước** (Bán hàng → Khuyến mại): chọn **nhiều sản phẩm cùng lúc**, nhập tên chương trình, mức giảm (1 đến 90%), thời gian bắt đầu và kết thúc, bật hoặc tắt. Mỗi sản phẩm tạo một khuyến mại riêng. Sửa, bật/tắt, xóa từng khuyến mại.

**Quy tắc**
- Thời gian kết thúc phải sau thời gian bắt đầu; sản phẩm phải tồn tại.
- **Trạng thái tính ở server** theo thứ tự ưu tiên: `disabled` (đã tắt), `expired` (đã hết hạn), `upcoming` (sắp diễn ra), còn lại `active` (đang chạy). Lọc danh sách theo trạng thái, theo sản phẩm, theo từ khóa.
- Giá cho khách lấy mức giảm cao nhất trong các khuyến mại đang hiệu lực của sản phẩm (xem mục 4).
- API: `GET/POST /admin/promotions`, `PATCH/DELETE /admin/promotions/:id`.

---

## 14. Quản lý người dùng (admin)

**Các bước** (Bán hàng → Người dùng): tìm theo tên, số điện thoại hoặc email; lọc theo trạng thái và vai trò; mở chi tiết để xem số đơn, tổng chi tiêu, đơn gần nhất (10 đơn), số địa chỉ, đánh giá, yêu thích; **khóa/mở khóa** tài khoản; **cấp hoặc hạ quyền** admin.

**Quy tắc** (`CustomerAdminService`)
- Khóa tài khoản có hiệu lực ngay (token cũ bị chặn, vì mỗi request kiểm tra trạng thái tài khoản).
- **Không tự khóa chính mình**, **không khóa tài khoản admin khác** (`CANNOT_LOCK_ADMIN`), **không tự đổi quyền của chính mình** (`CANNOT_MODIFY_SELF`).
- Đổi quyền chạy trong giao dịch và **thu hồi mọi token cũ** của người đó để quyền mới áp dụng ngay (vai trò nằm trong token).
- **Không hạ quyền admin cuối cùng** của hệ thống (`LAST_ADMIN`).
- API: `GET /admin/customers`, `GET /admin/customers/:id`, `PATCH /admin/customers/:id/status`, `PATCH /admin/customers/:id/role`.

---

## 15. Thống kê và tổng quan (admin)

**Các bước** (`/admin`): chọn khoảng thời gian (7, 30, 90 ngày hoặc từ ngày, đến ngày tùy chọn, tối đa 366 ngày) và xem:
- **Thẻ chỉ số:** đơn chờ xác nhận, doanh thu hôm nay, doanh thu tháng này, sản phẩm sắp hết hàng, doanh thu trong kỳ, số đơn trong kỳ, giá trị đơn trung bình, tổng người dùng và sản phẩm.
- **Biểu đồ doanh thu** theo ngày, tháng hoặc năm (vẽ bằng SVG tự viết, có bảng số liệu thay thế).
- **Đơn hàng theo trạng thái**, **Khách mua nhiều**, **Sản phẩm bán chạy**, **Tồn kho thấp** (mặc định từ 5 trở xuống).

**Quy tắc tính** (`StatsService`)
- **Doanh thu chỉ tính đơn "Giao hàng thành công"**, theo **ngày đơn chuyển sang giao thành công** (lấy từ lịch sử), theo **giờ Việt Nam (GMT+7)**.
- Các kỳ không có đơn được điền 0 để biểu đồ liền mạch. Số kỳ tối đa theo từng đơn vị (ngày, tháng, năm); vượt quá thì báo lỗi và yêu cầu thu hẹp khoảng ngày.
- API: `/admin/stats/overview`, `/revenue`, `/orders-by-status`, `/top-products`, `/low-stock`, `/top-customers`.

---

## 16. Nội dung (CMS), menu, banner

Tất cả quản lý ở khu vực admin, mục **Nội dung** và **Cài đặt**.

- **Bài viết (cẩm nang):** soạn bằng **Markdown** có tab xem trước, lưu nháp hoặc đăng, gỡ đăng. Ảnh đại diện tải lên Cloudinary. Trang khách `/articles` có tìm kiếm và phân trang, `/articles/<slug>`.
- **Trang nội dung:** `/pages/<slug>`. Có **6 trang hệ thống** (giới thiệu, bảo hành, đổi trả, giao hàng, điều khoản, hướng dẫn đo size) không xóa được và không đổi đường dẫn (`RESERVED_PAGE`).
- **Hỏi đáp (FAQ):** danh sách câu hỏi và trả lời, kèm từ khóa dùng cho chatbot, có thứ tự.
- **Banner:** hai vị trí: `home_hero` (băng chuyền đầu trang chủ) và `home_promo` (ô quảng cáo nhỏ). Khi **không có** banner băng chuyền nào đang bật, trang chủ hiện khối chữ và ảnh minh họa mặc định. Chỉ nhận địa chỉ ảnh bắt đầu bằng `https://`.
- **Menu:** menu **đầu trang** và **chân trang**, tối đa 2 cấp, mỗi mục có tên, đường dẫn, thứ tự, bật/tắt. Chỉ nhận đường dẫn nội bộ an toàn hoặc `http(s)`. Menu được **cache 5 phút** ở Redis (đổi menu thì cache được xóa). Fe tô mục đang mở trên thanh menu.
- **Thông tin cửa hàng** (Cài đặt → Thông tin cửa hàng): tên thương hiệu, khẩu hiệu, hotline, email, địa chỉ, giờ mở cửa, mạng xã hội, nội dung chân trang. Hiện ở đầu và chân trang, chatbot và hóa đơn in.
- **Vận chuyển:** các phương thức (tên, mô tả, phí, bật/tắt). Phí vận chuyển của đơn lấy theo **phương thức khách chọn**.

---

## 17. Chatbot

**Người dùng:** khách (nút chat nổi ở góc phải), không cần đăng nhập.

**Các bước:** mở khung chat, thấy lời chào và vài câu hỏi gợi ý; gõ câu hỏi hoặc bấm gợi ý; nhận câu trả lời.

**Cách hoạt động** (`ChatbotService`): **không dùng AI**, trả lời theo từ khóa trên danh sách hỏi đáp.
1. `GET /chatbot/suggestions`: lời chào và 4 câu hỏi đầu.
2. `POST /chatbot/ask`: chuẩn hóa câu hỏi (chữ thường, bỏ dấu tiếng Việt, bỏ dấu câu). Chấm điểm từng FAQ: **3 điểm** cho mỗi từ khóa hoặc cụm từ khóa xuất hiện trong câu hỏi (theo ranh giới từ), cộng **1 điểm** cho mỗi từ quan trọng của câu hỏi FAQ (bỏ từ dừng, từ dưới 3 ký tự) có trong câu hỏi. Chọn FAQ điểm cao nhất, **cần tối thiểu 3 điểm**; hòa thì ưu tiên thứ tự nhỏ hơn.
3. Có kết quả thì trả câu trả lời cùng gợi ý khác. Không đạt ngưỡng thì trả thông báo dự phòng kèm **hotline và email** cửa hàng và gợi ý các câu gần nhất.
- **Giới hạn:** khoảng **20 câu mỗi phút cho mỗi địa chỉ IP** (cửa sổ 60 giây, lưu Redis); vượt thì trả `429 RATE_LIMITED` kèm số giây phải chờ.
- Nội dung câu hỏi chỉ dùng để chấm điểm trong bộ nhớ, **không ghi log, không lưu**.
- Lịch sử trò chuyện lưu tạm ở trình duyệt của khách.

---

## 18. Cơ chế dùng chung

- **Phân quyền:** guard JWT cho route đăng nhập; decorator `@AdminOnly` cho route admin. Fe có `RouteGuard` theo vai trò.
- **Lỗi chuẩn:** mọi lỗi trả cùng cấu trúc (`statusCode`, `code`, `message`, `details`, `timestamp`, `path`). Mã dùng: `400` dữ liệu sai (kèm chi tiết từng trường), `401`, `403`, `404`, `409`, `429`, `500` (không lộ chi tiết).
- **Kiểm tra dữ liệu:** `class-validator` ở biên API (loại trường lạ, chuẩn hóa chuỗi).
- **CORS:** chỉ cho phép địa chỉ trong `FRONTEND_URL`; các header cho phép gồm `Content-Type`, `Authorization`, `Idempotency-Key`. Header tùy chỉnh mới phải được thêm vào danh sách này.
- **Redis:** OTP và mã đặt lại, khóa chống đặt trùng, giới hạn chatbot, cache dữ liệu đọc nhiều. Redis lỗi thì cache bị bỏ qua, chống đặt trùng chuyển sang chế độ không khóa (ghi cảnh báo) chứ không làm hỏng yêu cầu.
- **Cơ sở dữ liệu:** bảng và khóa ngoại tạo bằng SQL riêng trong `be/database/` (`synchronize: false`); entity chỉ khai báo cột (không dùng decorator quan hệ, truy vấn viết rõ ràng để tránh N+1). Thay đổi cho DB đã có dữ liệu thêm vào `be/database/changes/`. Kết nối SSL, xác thực bằng chứng chỉ CA (`DB_SSL_CA`).
- **Chống xung đột đồng thời:** khóa dòng (`FOR UPDATE`) khi đổi trạng thái đơn, ghi nhận thanh toán, đổi quyền; trừ kho bằng câu lệnh có điều kiện; khóa duy nhất ở DB làm lưới an toàn cuối cho dữ liệu trùng.
- **Giờ giấc:** thống kê và mã đơn tính theo **giờ Việt Nam**; dữ liệu lưu thời gian UTC.
- **Kiểm thử:** be dùng Vitest (đơn vị, e2e với DB thật), fe dùng Vitest và Testing Library. Test e2e thay `MailService` bằng bản giả để không gửi email thật.
