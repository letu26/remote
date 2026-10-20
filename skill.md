# Skill.md

> Đọc file này ngay sau khi đọc `claude.md`. Mô tả cách chia agent làm việc cho dự án website thương mại điện tử trang sức đá quý (Next.js + NestJS + MySQL).

Tài liệu yêu cầu nghiệp vụ: `D:\Remote\document\THIẾT KẾ VÀ XÂY DỰNG WEBSITE THƯƠNG MẠI ĐIỆN TỬ KINH DOANH TRANG SỨC ĐÁ QUÝ.docx`
Mã nguồn: `D:\Remote\jewelry-shop` (`be` = NestJS, `fe` = Next.js, `.env` ở thư mục gốc chứa thông tin MySQL Aiven).

---

## 1. Mô hình agent

Gồm 1 leader và 4 sub-agent (be, fe, test, design). Leader quản lý cả 4.

| Agent | Phạm vi | Làm | Không làm |
|---|---|---|---|
| **Leader** | Toàn dự án | Đọc và phân tích tài liệu yêu cầu, chia nhiệm vụ, giao việc, duyệt kết quả, hỏi người dùng khi nghiệp vụ chưa rõ | Không tự viết code chức năng thay sub-agent |
| **be** | `jewelry-shop/be` | NestJS: module, entity, repository, service, controller, DTO, auth, lỗi chuẩn | Không sửa `fe` |
| **fe** | `jewelry-shop/fe` | Next.js: trang, layout, guard, axios interceptor, store, giao diện responsive | Không sửa `be` |
| **test** | `be` và `fe` (chỉ thêm test) | Viết và chạy test API và giao diện, báo lỗi cho leader | Không sửa code chức năng; chỉ báo lỗi |
| **design** | `jewelry-shop/fe` (phần giao diện) | Hệ thống thiết kế (màu, chữ, nút, thẻ sản phẩm), bố cục và trang khách hàng, responsive, trạng thái loading/empty/error | Không sửa logic (services, guards, store, interceptor), không sửa `be` |

## 2. Quy trình

1. Leader đọc `claude.md`, `skill.md` và tài liệu yêu cầu.
2. Leader phân tích, tách thành nhiệm vụ nhỏ cho từng giai đoạn. Mỗi nhiệm vụ ghi rõ: agent nào làm, đầu vào, kết quả mong đợi, tiêu chí hoàn thành.
3. **Hợp đồng API do leader chốt trước** (đường dẫn, request, response, mã lỗi) để be và fe làm song song không lệch nhau.
4. be và fe làm việc theo hợp đồng. test viết test theo hợp đồng và chạy trên kết quả của be/fe.
5. test báo lỗi cho leader, leader giao lại cho be hoặc fe sửa. Lặp đến khi test qua.
6. Leader tổng hợp kết quả và báo người dùng.
7. Trong quá trình làm, leader tiếp tục phân tích tài liệu và phân bổ nhiệm vụ mới cho các sub-agent.

## 3. Quy tắc hỏi lại người dùng

- Nghiệp vụ nào không rõ hoặc tài liệu chưa nói: **leader phải hỏi người dùng trước khi giao việc**, không tự đoán.
- Sub-agent gặp điểm chưa rõ thì dừng, báo leader; leader gom câu hỏi rồi hỏi người dùng.
- Câu hỏi ngắn, có phương án gợi ý để người dùng chọn nhanh.
- Quyết định đã chốt thì ghi vào mục 4, không hỏi lại.

## 4. Quyết định đã chốt

- Công nghệ: Next.js (fe), NestJS (be), MySQL online trên Aiven.
- Tổ chức be: mỗi domain là một module, bên trong chia `controllers/`, `services/`, `repositories/`, `dtos/`; phần dùng chung (`config/`, `exceptions/`, `middlewares/`, `utils/`) ở cấp `src/`.
- Role: `admin` và `user` trước; `manager` thêm sau nếu cần.
- Phí vận chuyển: tính theo **phương thức vận chuyển** (admin tạo các phương thức, mỗi phương thức có một mức phí).
- Gửi mail (OTP) qua SMTP Gmail, thông tin đã có trong `be/.env`.
- Quên mật khẩu bằng **OTP qua email** (thay luồng link cũ): `/forgot-password` -> `/verify-otp` -> `/reset-password`, mỗi bước là một trang riêng. OTP 6 số, lưu **Redis** dạng băm HMAC, hết hạn **2 phút**; sai tối đa 5 lần, gửi lại cách nhau 60 giây; OTP đúng thì cấp mã đặt lại dùng một lần (Redis, 10 phút). Redis chạy bằng `docker compose` ở `jewelry-shop/docker-compose.yml`.
- **Blacklist token trong DB** (bảng `token_blacklist`): đăng xuất thì token đang dùng bị đưa vào blacklist; đổi mật khẩu hoặc đặt lại mật khẩu thì **mọi token cũ** của tài khoản bị vô hiệu. Mỗi request tra blacklist và kiểm tra tài khoản có bị khóa không. Chi tiết trong `API_CONTRACT.md`.
- Các trang auth riêng biệt: `/login`, `/register`, `/logout`, `/forgot-password`, `/verify-otp`, `/reset-password`, `/change-password`.
- Đăng nhập bằng số điện thoại; email và số điện thoại không được trùng; mật khẩu tối thiểu 6 ký tự.
- Token hết hạn 1 ngày, chứa `email`, `role`, `id`.
- CSDL: MySQL Aiven (`jewelry-shop-db`). Bảng và khóa ngoại tạo bằng SQL riêng trong `be/database/` (`01_create_tables.sql`, `02_add_foreign_keys.sql`), **BE không tự tạo bảng** (`synchronize: false`). Entity TypeORM ở `be/src/modules/<domain>/models/` chỉ khai báo cột, không dùng decorator quan hệ (xem claude.md mục 1.3).
- Khuyến mại: bảng `promotions` (theo từng sản phẩm, % giảm, có thời gian bắt đầu/kết thúc). Giá khuyến mại tính từ khuyến mại đang hiệu lực, không lưu trên `products`.
- Đá quý: một sản phẩm có nhiều loại đá qua bảng nối `product_gemstones` (số lượng, carat, màu, độ tinh khiết, kiểu cắt).
- Địa chỉ: theo đơn vị hành chính **sau sáp nhập 01/07/2025, chỉ 2 cấp** (không còn quận/huyện): `provinces` (34) → `wards` (3.321 xã/phường). Đã nạp từ provinces.open-api.vn (API v2) qua `npm run seed:locations` trong `be` (dữ liệu ở `be/scripts/data/vn-provinces.json`). Đơn hàng lưu bản sao tên tỉnh và xã/phường. Tài liệu khách ghi "Quận/Huyện" nhưng đã lỗi thời, form địa chỉ chỉ có Tỉnh/Thành và Phường/Xã.
- Tổng số bảng hiện tại: 28.
- Giao diện: phong cách **trắng kem + vàng gold**, sáng và thanh lịch (tham khảo PNJ, Doji, HuyThanh). Tên thương hiệu tạm là "Lumière Gems" (một hằng số duy nhất trong `fe/src/constants`, đổi một chỗ là đổi toàn site).
- Tồn kho lưu theo `product_variants` (có cột `version` cho khóa lạc quan).

## 5. Giai đoạn 1 (đã chốt)

Chỉ làm **nền tảng + Auth**:
- be: kết nối MySQL (đọc `.env`, bật SSL), cấu trúc thư mục, xử lý lỗi thống nhất, đăng ký, đăng nhập, JWT, phân quyền theo role, quên/đặt lại mật khẩu, đổi mật khẩu, xem/sửa thông tin cá nhân.
- fe: cấu trúc thư mục, axios + interceptor, trang đăng ký/đăng nhập chung chuyển hướng theo role, guard route, trang không có quyền, layout responsive.
- test: test API auth (đăng ký trùng, sai mật khẩu, token hết hạn/sai, thiếu quyền) và luồng đăng nhập ở fe.

Giai đoạn 1 đã xong (be, fe, test qua).

## 5b. Giai đoạn 2 (đã chốt): Danh mục + Sản phẩm

Hợp đồng chi tiết: `API_CONTRACT_PHASE2.md`.
- be: API công khai (cây danh mục, bộ lọc, danh sách sản phẩm có tìm kiếm/lọc/sắp xếp/phân trang, chi tiết sản phẩm kèm sản phẩm liên quan) và API admin CRUD (danh mục, chất liệu, loại đá, bộ sưu tập, sản phẩm với biến thể/size/tồn kho/đá quý, ảnh).
- Ảnh lưu trên **Cloudinary** (upload từ server, lưu `url` và `publicId` trong `product_images`). Cần `CLOUDINARY_URL` trong `be/.env` (người dùng cung cấp; trống thì upload trả 503 `UPLOAD_NOT_CONFIGURED`).
- Bộ lọc "Dành cho": chọn Nữ/Nam thì gồm cả sản phẩm unisex.
- Giá khuyến mại tính từ bảng `promotions` (mức giảm cao nhất đang hiệu lực); quản lý khuyến mại làm ở giai đoạn sau.
- Xóa sản phẩm đã có trong đơn hàng bị chặn (409), chỉ ẩn được; danh mục/chất liệu/loại đá/bộ sưu tập đang được dùng cũng không xóa được.
- fe chia hai phần: giao diện khách (nối API thật) và giao diện admin (CRUD).
- Giai đoạn 2 đã xong (be, fe khách, fe admin, test qua; tải ảnh Cloudinary thật đã thử qua).

## 5g. Giai đoạn 7 (đã xong): Khuyến mại, Quản lý khách hàng, Thống kê

Hợp đồng chi tiết: `API_CONTRACT_PHASE7.md`. Đã chốt: khuyến mại theo sản phẩm có thời gian (tạo cho nhiều sản phẩm một lúc, mức giảm 1..90%, trạng thái đang chạy/sắp tới/hết hạn/đã tắt tính ở server; giá cho khách lấy mức giảm cao nhất đang hiệu lực); quản lý khách hàng (tìm kiếm, khóa/mở khóa tài khoản role `user` có hiệu lực ngay, đổi quyền user/admin có thu hồi token và không hạ quyền admin cuối cùng, xem đơn gần nhất); thống kê tính doanh thu theo **đơn giao thành công, theo ngày đơn chuyển sang giao thành công (giờ Việt Nam)**, có tổng quan, biểu đồ doanh thu theo ngày/tháng/năm, đơn theo trạng thái, sản phẩm bán chạy, tồn kho thấp (mặc định <= 5), khách mua nhiều, giá trị đơn trung bình. Biểu đồ vẽ bằng SVG tự viết (không thêm thư viện). Vai trò nhân viên (`manager`) chưa làm.

## 5f. Giai đoạn 6 (đã xong): Nội dung (CMS) và Chatbot

Hợp đồng chi tiết: `API_CONTRACT_PHASE6.md`. Đã chốt: nội dung bài viết/trang là **Markdown** (hiển thị bằng `MarkdownContent`, không cho HTML thô); ảnh banner/bài viết tải lên Cloudinary qua `/admin/media/images`; thông tin cửa hàng (tên thương hiệu, hotline, địa chỉ, email, giờ mở cửa, mạng xã hội) quản lý trong DB (`site.*`) thay cho hằng số; menu header/footer quản lý bằng admin (tối đa 2 cấp); 6 trang hệ thống (giới thiệu, bảo hành, đổi trả, giao hàng, điều khoản, hướng dẫn đo size) không xóa được; chatbot trả lời theo từ khóa trên FAQ (không dùng AI), giới hạn 20 câu/phút mỗi IP. Điểm đánh giá của sản phẩm mẫu đã đặt lại về 0 cho khớp dữ liệu thật.

## 5e. Giai đoạn 5 (đã xong): Đánh giá sản phẩm

Hợp đồng chi tiết: `API_CONTRACT_PHASE5.md`. Đã chốt: chỉ người đã mua và nhận hàng (đơn `delivered`) mới được đánh giá; mỗi khách một đánh giá cho một sản phẩm (khóa unique `userId + productId`), được sửa hoặc xóa của mình; điểm 1 đến 5, nhận xét tùy chọn tối đa 1000 ký tự; admin chỉ ẩn/hiện (không xóa), đánh giá ẩn không tính vào điểm trung bình; tên người đánh giá công khai được che bớt; điểm và số lượt trên sản phẩm cập nhật trong cùng transaction.

## 5d. Giai đoạn 4 (đã xong): Đặt hàng, Thanh toán, Quản lý đơn hàng

Hợp đồng chi tiết: `API_CONTRACT_PHASE4.md`. Đã chốt: **trừ tồn kho ngay khi đặt hàng**, hoàn khi hủy đơn; thanh toán COD và chuyển khoản; thông tin chuyển khoản dùng **giá trị mẫu** (admin sửa trong `/admin/settings`); khách chỉ hủy khi `pending`; luồng trạng thái từng bước; chống đặt trùng bằng `Idempotency-Key` (Redis). Sau khi hoàn tất các giai đoạn, **tích hợp thanh toán qua cổng bên thứ ba ở môi trường sandbox/dev** (không phải môi trường thật); logic thanh toán giữ trong module `payments` riêng để cắm thêm nhà cung cấp. Cổng thanh toán cụ thể chưa chọn (hỏi người dùng trước khi làm).

## 5c. Giai đoạn 3 (đã xong): Giỏ hàng, Yêu thích, Sổ địa chỉ

Hợp đồng chi tiết: `API_CONTRACT_PHASE3.md`. Giỏ hàng chỉ cho người đã đăng nhập; giá luôn là giá hiện tại; tối đa 10 sản phẩm mỗi dòng; không giữ chỗ tồn kho (chỉ trừ khi đặt hàng, giai đoạn 4); phí vận chuyển tính ở bước thanh toán. Sổ địa chỉ tối đa 10, luôn có đúng một địa chỉ mặc định, địa chỉ hành chính 2 cấp (tỉnh/thành -> xã/phường). Đăng nhập hỗ trợ `?redirect=` (chỉ đường dẫn nội bộ).
- Giai đoạn 4 (đặt hàng, thanh toán, quản lý đơn), đánh giá, CMS, khuyến mại admin, thống kê làm sau. Cần chốt trước giai đoạn 4: trừ tồn kho lúc đặt hàng hay lúc admin xác nhận; thông tin chuyển khoản.

## 6. Câu hỏi còn mở

- Ảnh sản phẩm và banner lưu ở đâu (local trên server, Cloudinary, hay nơi khác)? Cần chốt trước giai đoạn sản phẩm.
- Bảng `password_reset_tokens` (luồng cũ) còn trong DB cho tới khi người dùng tự chạy `be/database/changes/002_drop_password_reset_tokens.sql`.
