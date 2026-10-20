# Báo cáo tiến độ: Website thương mại điện tử trang sức đá quý

Cập nhật: 17/10/2026. Phạm vi: những gì đã làm, những gì chưa làm, và việc cần làm để hoàn thiện.

Tài liệu yêu cầu gốc: `D:\Remote\document\THIẾT KẾ VÀ XÂY DỰNG WEBSITE THƯƠNG MẠI ĐIỆN TỬ KINH DOANH TRANG SỨC ĐÁ QUÝ.docx`.

---

## 1. Tóm tắt nhanh

| Hạng mục | Tình trạng |
|---|---|
| Nền tảng (frontend, backend, CSDL, Redis) | Xong |
| Tài khoản và xác thực (đăng ký, đăng nhập, quên mật khẩu bằng OTP, đăng xuất, đổi mật khẩu) | Xong |
| Danh mục và sản phẩm (admin quản lý, khách xem, tìm kiếm, lọc, sắp xếp) | Xong |
| Giỏ hàng, yêu thích, sổ địa chỉ | Xong |
| Đặt hàng, thanh toán COD và chuyển khoản, quản lý đơn hàng, in hóa đơn | Xong |
| Đánh giá sản phẩm | Xong |
| Nội dung CMS (banner, menu, bài viết, trang chính sách, FAQ), chatbot | Xong |
| Quản lý khuyến mại, quản lý khách hàng, thống kê (admin) | Xong |
| Thanh toán qua cổng bên thứ ba (sandbox) | Chưa làm (đã chuẩn bị chỗ cắm) |
| Kiểm tra thủ công trên trình duyệt, rà soát bảo mật, triển khai | Chưa làm |

Kết quả kiểm thử tự động ở lần chạy cuối (sau giai đoạn 7): backend 431 test e2e và 58 test đơn vị qua hết, frontend 453 test qua hết (một test của khung chatbot từng báo lỗi chập chờn một lần khi máy đang bận ở giai đoạn 6, chạy lại riêng và chạy lại cả bộ đều qua). Các test này dùng DB thật (backend) hoặc dữ liệu giả lập (frontend). **Chưa có ai chạy thử luồng đầy đủ trên trình duyệt thật và chưa ai xem giao diện bằng mắt** (xem mục 6).

---

## 2. Công nghệ và cách tổ chức

| Thành phần | Công nghệ |
|---|---|
| Frontend (`fe`) | Next.js (App Router, TypeScript, Tailwind), axios, SweetAlert2 |
| Backend (`be`) | NestJS (TypeScript), TypeORM, kiến trúc 3 lớp (controller, service, repository), mỗi domain một module |
| CSDL | MySQL 8 trên Aiven (`jewelry-shop-db`), 28 bảng, kết nối SSL |
| Bộ nhớ đệm, OTP | Redis chạy bằng Docker (`docker-compose.yml`) |
| Lưu ảnh | Cloudinary (tải ảnh từ server) |
| Gửi email | SMTP Gmail (gửi mã OTP) |

Quy ước bắt buộc (ghi trong `claude.md`):
- Entity chỉ khai báo cột, **không dùng decorator quan hệ** của ORM (tránh N+1 query).
- **Backend không tự tạo hoặc sửa bảng.** Bảng và khóa ngoại tạo bằng file SQL riêng trong `be/database/` (`01_create_tables.sql`, `02_add_foreign_keys.sql`, thay đổi trong `changes/`).
- Token đăng nhập hết hạn sau 1 ngày, lưu ở `sessionStorage` (mỗi tab đăng nhập riêng, đóng tab là mất phiên).
- Thông báo kết quả bằng toast, hộp xác nhận bằng SweetAlert2.

Cấu trúc thư mục chính (`D:\Remote\jewelry-shop`):
- `be/`: backend (`src/modules/<domain>`, `database/`, `scripts/`, `test/`).
- `fe/`: frontend (`src/app`, `components`, `services`, `store`, `guards`, `utils`).
- `docker-compose.yml`: Redis.
- `API_CONTRACT*.md`: hợp đồng API từng giai đoạn (4 file).

---

## 3. Những gì đã làm

### Giai đoạn 0: Nền tảng
- Dựng khung Next.js và NestJS, kết nối MySQL Aiven qua file `be/.env`.
- Thiết kế 28 bảng và các khóa ngoại, tạo bằng file SQL riêng. Đã thêm bảng khuyến mại có thời gian, bảng nối đá quý cho sản phẩm, bảng blacklist token.
- Địa chỉ hành chính **sau sáp nhập (2 cấp)**: đã nạp 34 tỉnh/thành và 3.321 xã/phường từ nguồn công khai.
- Quy trình làm việc theo nhóm agent (leader, be, fe, test, design) ghi trong `skill.md`.

### Giai đoạn 1: Tài khoản và xác thực
- Đăng ký (họ tên, email, số điện thoại, mật khẩu, xác nhận, đồng ý điều khoản), đăng nhập bằng số điện thoại, đăng xuất, đổi mật khẩu. Mỗi chức năng là một trang riêng.
- Quên mật khẩu bằng **OTP qua email**: OTP 6 số, lưu Redis dạng băm, hết hạn sau 2 phút, nhập sai tối đa 5 lần (hiện số lần còn lại), gửi lại cách nhau 60 giây, sau khi OTP đúng mới được đặt mật khẩu mới (mã dùng một lần).
- **Blacklist token trong DB:** đăng xuất đưa token vào blacklist; đổi hoặc đặt lại mật khẩu vô hiệu mọi token cũ. Mỗi request đều kiểm tra blacklist và trạng thái khóa tài khoản.
- Phân quyền hai vai trò `admin` và `user`, guard chặn truy cập trực tiếp bằng đường dẫn, đăng nhập quay lại đúng trang cũ (`?redirect=`, chỉ nhận đường dẫn nội bộ).
- Mật khẩu băm bằng bcrypt, admin không xem được mật khẩu.

### Giai đoạn 2: Danh mục và sản phẩm
- **Admin:** quản lý danh mục (cây cha-con), chất liệu, loại đá, bộ sưu tập, sản phẩm (mã, giá nhập, giá bán, đá quý nhiều loại, biến thể theo size kèm tồn kho, ảnh, bảo hành, chứng nhận, nổi bật, ẩn/hiện). Đổi tồn kho an toàn khi nhiều thao tác cùng lúc.
- **Ảnh:** tải lên Cloudinary (tối đa 10 ảnh mỗi sản phẩm, kiểm tra loại file thật, đặt ảnh đại diện, sắp xếp, xóa). Đã thử tải ảnh thật thành công.
- **Khách:** danh sách sản phẩm có tìm kiếm (tên, mã), lọc (danh mục, bộ sưu tập, chất liệu, loại đá, đối tượng, khoảng giá, còn hàng, đang giảm giá), sắp xếp (mới nhất, giá, bán chạy, đánh giá), phân trang; trang chi tiết có bộ ảnh, thông số đá quý, chọn size, sản phẩm liên quan.
- **Khuyến mại:** giá giảm tính từ bảng khuyến mại đang hiệu lực (lấy mức giảm cao nhất).
- Dữ liệu mẫu: 14 sản phẩm (mã `DEMO-001..014`), 6 khuyến mại mẫu, 5 danh mục, 8 chất liệu, 5 loại đá, 4 bộ sưu tập.

### Giai đoạn 3: Giỏ hàng, yêu thích, sổ địa chỉ
- **Giỏ hàng** (cần đăng nhập): thêm theo đúng size, tăng giảm số lượng, xóa dòng hoặc nhiều dòng, cảnh báo hết hàng, thiếu tồn, ngừng bán; tối đa 10 mỗi dòng; giá luôn là giá hiện tại; số lượng trên biểu tượng giỏ.
- **Yêu thích:** thêm bỏ bằng trái tim (đổi ngay khi bấm), trang danh sách riêng.
- **Sổ địa chỉ:** tối đa 10 địa chỉ, luôn có một địa chỉ mặc định, chọn tỉnh rồi xã/phường.

### Giai đoạn 4: Đặt hàng, thanh toán, quản lý đơn
- **Khách:** trang thanh toán xem lại toàn bộ sản phẩm, số lượng, giá, tổng tiền; chọn địa chỉ, phương thức vận chuyển, thanh toán (COD hoặc chuyển khoản), ghi chú. Đặt hàng an toàn khi nhiều người đặt cùng lúc, chống đặt trùng khi bấm đúp, báo khi giá đổi.
- **Tồn kho:** trừ ngay khi đặt hàng, hoàn lại khi hủy đơn (đúng một lần).
- **Theo dõi đơn:** danh sách đơn theo trạng thái, chi tiết kèm tiến trình, thông tin chuyển khoản có nút sao chép, hủy đơn khi còn chờ xác nhận.
- **Admin:** danh sách đơn có tìm kiếm và lọc (trạng thái, thanh toán, ngày), chuyển trạng thái đúng từng bước (Chờ xác nhận, Đã xác nhận, Đang chuẩn bị, Đang giao, Giao thành công, Đã hủy), xác nhận đã thanh toán, in hóa đơn, quản lý phương thức vận chuyển, cài đặt thông tin chuyển khoản.
- **Quy tắc:** khách chỉ hủy khi còn chờ xác nhận; admin hủy được đến bước chuẩn bị hàng; đơn COD tự thành "đã thanh toán" khi giao thành công; logic thanh toán tách riêng để cắm cổng thanh toán sau này.

### Giai đoạn 5: Đánh giá sản phẩm
- **Quy tắc:** chỉ khách đã mua và đã nhận hàng (đơn "giao thành công") mới được đánh giá; mỗi khách một đánh giá cho một sản phẩm (khóa duy nhất trong DB), được sửa hoặc xóa đánh giá của mình để viết lại; chấm 1 đến 5 sao, nhận xét không bắt buộc, tối đa 1000 ký tự.
- **Khách:** mục "Đánh giá khách hàng" trên trang sản phẩm (điểm trung bình, biểu đồ phân bố sao, lọc theo sao, phân trang, form viết/sửa/xóa), nút "Đánh giá" trong đơn đã giao, trang `/user/reviews`. Tên người đánh giá bị che bớt (`Trần T. D.`), không lộ email hay số điện thoại; nhận xét hiển thị dạng văn bản thuần.
- **Admin:** trang `/admin/reviews` (tìm kiếm, lọc theo sao, ẩn/hiện, theo sản phẩm); chỉ ẩn hoặc hiện, không xóa. Đánh giá bị ẩn không hiện công khai và không tính vào điểm trung bình.
- **Tổng hợp điểm:** điểm trung bình và số lượt trên sản phẩm cập nhật trong cùng transaction với mọi thao tác nên luôn khớp, kể cả khi nhiều người đánh giá cùng lúc; sắp xếp "được đánh giá cao" ở danh sách sản phẩm dùng dữ liệu này.
- **Đã kiểm thử:** quyền đánh giá, chống trùng song song, 9 người đánh giá song song, admin ẩn đúng lúc chủ sửa (không lỗi 5xx hay deadlock), tên che, ẩn thông tin cá nhân.

### Giai đoạn 7: Khuyến mại, khách hàng, thống kê
- **Khuyến mại (admin):** tạo cho nhiều sản phẩm cùng lúc (giảm 1 đến 90%, có thời gian bắt đầu và kết thúc), xem theo trạng thái (đang chạy, sắp tới, hết hạn, đã tắt), sửa, bật/tắt, xóa. Giá khách thấy lấy mức giảm cao nhất đang hiệu lực và cập nhật ngay sau mỗi thay đổi (trang sản phẩm, danh sách giảm giá, giỏ hàng).
- **Khách hàng (admin):** danh sách có tìm kiếm, lọc theo trạng thái và vai trò, số đơn, tổng chi tiêu; chi tiết kèm 10 đơn gần nhất; khóa hoặc mở khóa (có hiệu lực ngay); đổi quyền user và admin (người bị đổi phải đăng nhập lại). Không tự khóa hay tự đổi quyền của mình, không khóa được admin, không hạ quyền admin cuối cùng.
- **Thống kê (dashboard `/admin`):** đơn chờ xác nhận, doanh thu hôm nay và tháng này, số khách, số sản phẩm, sản phẩm sắp hết hàng, doanh thu và số đơn trong kỳ, giá trị đơn trung bình; biểu đồ doanh thu theo ngày, tháng, năm (vẽ bằng SVG, có bảng số liệu thay thế); đơn theo trạng thái; sản phẩm bán chạy; tồn kho thấp; khách mua nhiều. **Doanh thu chỉ tính đơn giao thành công, theo ngày đơn chuyển sang giao thành công (giờ Việt Nam)**; đơn hủy không tính.
- **Đã kiểm thử:** thống kê với dữ liệu cố định kể cả cặp đơn sát nửa đêm giờ Việt Nam, đối chiếu tính tay; khuyến mại chồng nhau; khóa và đổi quyền có hiệu lực ngay; 14 endpoint mới đều có kiểm tra quyền.
- **Chưa kiểm được trên DB thật:** nhánh "không hạ quyền admin cuối cùng" (luôn còn admin thật), chỉ kiểm bằng test đơn vị giả lập.

### Giai đoạn 6: Nội dung (CMS) và chatbot
- **Admin:** quản lý banner (tải ảnh lên Cloudinary), menu hai cấp cho đầu trang và chân trang, bài viết (soạn Markdown có tab xem trước, lưu nháp, đăng, gỡ đăng), trang nội dung (6 trang hệ thống không xóa được và không đổi đường dẫn), câu hỏi thường gặp (có khối thử chatbot), thông tin cửa hàng (tên thương hiệu, khẩu hiệu, hotline, email, địa chỉ, giờ mở cửa, mạng xã hội, chân trang). Hóa đơn in đã có hotline, địa chỉ, email của cửa hàng.
- **Khách:** băng chuyền banner trang chủ, menu và chân trang lấy từ DB (có phương án dự phòng khi API lỗi), trang `/articles`, `/articles/[slug]`, `/pages/[slug]`, `/faq`, khối "Cẩm nang trang sức" trên trang chủ, liên kết điều khoản ở trang đăng ký và chính sách ở trang sản phẩm.
- **Chatbot:** trả lời bằng cách chấm điểm từ khóa của câu hỏi thường gặp (bỏ dấu tiếng Việt nên gõ có dấu hay không dấu đều hiểu), không khớp thì đưa hotline và email; giới hạn 20 câu mỗi phút mỗi IP; lịch sử trong phiên trình duyệt; không nhớ ngữ cảnh và không tra cứu đơn hàng.
- **An toàn nội dung:** nội dung bài viết và trang là Markdown, hiển thị không cho HTML thô; liên kết chỉ nhận đường dẫn nội bộ hoặc http/https (từ chối `javascript:`, `data:`).
- **Dữ liệu mẫu** đã nạp vào DB: 6 trang chính sách, 10 câu hỏi thường gặp, 3 bài viết, 17 mục menu, thông tin cửa hàng mặc định. Gỡ bằng `npm run seed:cms -- --remove` (chỉ gỡ phần chưa bị admin sửa).

### Giao diện
- Phong cách **trắng kem + vàng gold**, gọn, có chuyển động nhẹ (tắt khi hệ điều hành bật giảm chuyển động), responsive, tiếng Việt.
- Thông báo bằng toast, hộp xác nhận bằng SweetAlert2 (nút xóa mặc định chọn "Hủy").
- Tên thương hiệu lấy từ một hằng số duy nhất (hiện là "Lumière Gems", tạm).

### Kiểm thử
- Backend: 258 test e2e chạy trên MySQL và Redis thật (gồm kịch bản chạy song song như 20 request thêm giỏ, 10 người đặt cùng một biến thể còn 3 sản phẩm, hủy song song), 9 test đơn vị.
- Frontend: 308 test (guard, interceptor, validate, form, giỏ hàng, thanh toán, đơn hàng, admin...).
- Test không gọi Cloudinary thật và không gửi email thật; dữ liệu test được dọn sau khi chạy.

---

## 4. Đối chiếu với tài liệu yêu cầu của khách

### Phía khách hàng

| Chức năng theo tài liệu | Tình trạng |
|---|---|
| Trang chủ: logo, tìm kiếm, menu, danh mục nổi bật, sản phẩm mới, bán chạy, giảm giá, chính sách | Xong |
| Trang chủ: banner quảng cáo | Xong (băng chuyền banner quản lý bằng admin; chưa có banner nào nên đang hiện hero tĩnh) |
| Trang chủ: bài viết tư vấn trang sức | Xong (3 bài mẫu, có trang danh sách và chi tiết) |
| Trang chủ: chatbot CSKH | Xong (trả lời theo từ khóa trên câu hỏi thường gặp, không dùng AI) |
| Danh sách sản phẩm, bộ lọc, sắp xếp | Xong (sắp xếp "được đánh giá cao" chưa có dữ liệu vì chưa có đánh giá) |
| Chi tiết sản phẩm | Xong, trừ đánh giá của khách hàng |
| Tìm kiếm | Xong (tìm theo tên, mã; các tiêu chí còn lại dùng bộ lọc) |
| Đăng ký, đăng nhập, đăng xuất, quên mật khẩu | Xong |
| Quản lý tài khoản: sửa thông tin, địa chỉ, đổi mật khẩu, lịch sử đơn, chi tiết đơn, hủy đơn, yêu thích | Xong |
| Giỏ hàng | Xong (phí vận chuyển tính ở bước thanh toán) |
| Xác nhận đặt hàng, thanh toán COD và chuyển khoản | Xong |
| Quản lý và theo dõi đơn hàng | Xong |
| Đánh giá sản phẩm (chỉ người đã mua và nhận hàng) | Xong |

### Phía quản trị

| Chức năng theo tài liệu | Tình trạng |
|---|---|
| Đăng nhập admin, phân quyền | Xong (dùng chung trang đăng nhập, vào `/admin` theo vai trò) |
| Trang tổng quan (số đơn, doanh thu, biểu đồ...) | Xong (dashboard có thẻ chỉ số và biểu đồ doanh thu) |
| Quản lý danh mục, sản phẩm | Xong |
| Quản lý đơn hàng, in hóa đơn | Xong |
| Quản lý tài khoản khách (xem, tìm, khóa/mở, lịch sử mua) | Xong |
| Phân quyền admin hoặc nhân viên | Làm một phần: đổi được giữa user và admin; vai trò "nhân viên" **chưa làm** (mới có hai vai trò cố định) |
| Quản lý banner và menu | Xong |
| Quản lý nội dung (bài viết, giới thiệu, chính sách bảo hành, đổi trả, FAQ, chân trang, liên hệ) | Xong (nội dung hiện là mẫu, cần thay bằng nội dung thật của khách) |
| Thống kê (doanh thu, đơn theo trạng thái, bán chạy, tồn kho thấp, khách mua nhiều, giá trị đơn trung bình) | Xong |
| Quản lý khuyến mại | Xong |

---

## 5. Còn lại để hoàn thiện (theo thứ tự đề xuất)

### Vai trò nhân viên (chưa làm)
- Tài liệu có nhắc "admin hoặc nhân viên". Hiện chỉ có hai vai trò `admin` và `user`. Thêm vai trò nhân viên cần đổi DB (thêm giá trị vai trò) và định nghĩa nhân viên được làm gì (ví dụ chỉ xử lý đơn hàng, không quản lý khách hay cài đặt). Cần bạn chốt phạm vi quyền nếu khách yêu cầu.

### Tích hợp thanh toán qua cổng bên thứ ba (môi trường sandbox)
- Theo yêu cầu của bạn, làm sau khi hoàn tất các giai đoạn trên, chạy ở môi trường thử nghiệm, không dùng tiền thật.
- Đã tách logic thanh toán thành module riêng để cắm thêm nhà cung cấp. **Cần bạn chọn cổng cụ thể** (ví dụ VNPay, MoMo, PayOS) và cung cấp tài khoản sandbox.
- Việc cần làm: thêm phương thức thanh toán mới, bảng giao dịch, trang chuyển sang cổng và nhận kết quả, xử lý thông báo từ cổng, đối soát trạng thái đơn.

### Hoàn thiện cuối
- Chạy thử toàn bộ luồng trên trình duyệt, sửa các lỗi giao diện và trải nghiệm.
- Rà soát bảo mật (giới hạn số lần đăng nhập sai, tiêu đề bảo mật HTTP, CORS, nhật ký, kiểm tra đầu vào) và hiệu năng.
- Chuẩn bị triển khai: cấu hình môi trường, HTTPS, đóng gói (Docker), sao lưu CSDL, cách quản lý thay đổi lược đồ (hiện dùng file SQL thủ công).

---

## 6. Việc tồn đọng và rủi ro cần biết

### Chưa kiểm chứng
- Chưa có ai chạy thử luồng thật trên trình duyệt (đăng ký, đặt hàng, admin xử lý đơn, nhận OTP qua email thật).
- Chưa ai xem giao diện bằng mắt, đặc biệt: sau khi làm gọn hàng loạt, trang chi tiết sản phẩm, trang admin trên điện thoại, trang in hóa đơn khổ A4, giao diện toast và hộp xác nhận.
- Hai tài khoản thử dùng email giả nên không nhận được OTP; muốn thử luồng quên mật khẩu cần đăng ký tài khoản có email thật.
- Hai file SQL gốc (`01_create_tables.sql`, `02_add_foreign_keys.sql`) đã được chạy lại thử trên một database tạm sau thay đổi đầu tiên. Các thay đổi sau đó (cột ảnh, cột đơn hàng, đổi tên chỉ mục) chưa được chạy thử lại theo cách này vì hệ thống chặn tạo và xóa database tạm.

### Nội dung tạm cần thay bằng thông tin thật của khách
- Tên thương hiệu "Lumière Gems"; hotline, email, địa chỉ cửa hàng ở chân trang; hóa đơn chỉ in tên thương hiệu và khẩu hiệu.
- **Thông tin chuyển khoản là mẫu** (số tài khoản `0123456789`); sửa tại `/admin/settings`.
- Bảng quy đổi size nhẫn là số giả định; nội dung chính sách bảo hành, đổi trả, giao hàng là chữ minh họa.
- Hai phương thức vận chuyển mẫu (30.000đ và 60.000đ); dữ liệu 14 sản phẩm mẫu và 6 khuyến mại mẫu (xóa bằng `npm run seed:catalog -- --remove`).
- Tài liệu của khách ghi "Quận/Huyện" nhưng đơn vị này đã bị bãi bỏ, form địa chỉ chỉ có Tỉnh/Thành và Phường/Xã.

### Vệ sinh dữ liệu và bảo mật
- Các mật khẩu và khóa sau đã xuất hiện trong lịch sử trao đổi: mật khẩu ứng dụng Gmail, mật khẩu hai tài khoản thử, mật khẩu admin thử, khóa Cloudinary (cả khóa cũ lẫn khóa mới). **Nếu dự án sẽ công khai hoặc đưa lên git, cần đổi tất cả.** Khóa Cloudinary cũ (`785139916916412`) nên xóa trên trang quản lý Cloudinary.
- Hai tài khoản thử (`0900000001` admin, `0900000002` user) cần xóa hoặc đặt mật khẩu mạnh trước khi chạy thật.
- Tệp `be/.env` và thư mục `be/certs/` đã được loại khỏi git qua `.gitignore`; dự án hiện chưa là kho git.
- Bảng `password_reset_tokens` (luồng link cũ) vẫn còn trong DB, trống và không dùng nữa. Dọn bằng `be/database/changes/002_drop_password_reset_tokens.sql` khi bạn muốn (hệ thống chặn tôi tự xóa trên DB thật).
- Hai chỉ mục unique trùng lặp tên kiểu cũ (`REL_...`) còn ở bảng `carts` và `reviews`, tên khóa ngoại vẫn là tên cũ dạng `FK_...`; không ảnh hưởng chạy.
- Các token đăng nhập cấp trước khi thêm cơ chế blacklist không còn hợp lệ, người dùng đăng nhập lại một lần.

### Điểm kỹ thuật cần lưu ý
- Token ở `sessionStorage`: mở tab mới hoặc đóng tab là phải đăng nhập lại (đã thống nhất với bạn).
- Test e2e của backend dùng chung một DB thật nên **không được chạy hai lần cùng lúc**, nếu không sẽ báo lỗi giả. Một lần chạy đầy đủ mất khoảng 10 phút.
- Đặt hàng song song cùng một khóa chống trùng: chỉ một request được xử lý, các request còn lại nhận "đang xử lý".
- Đơn chuyển khoản đã thanh toán rồi bị hủy: hệ thống chỉ ghi nhận hủy, hoàn tiền xử lý ngoài hệ thống.
- Phần lọc "Dành cho" Nữ hoặc Nam có gồm cả sản phẩm unisex (quyết định tạm, chờ khách xác nhận).

---

## 7. Hướng dẫn chạy và tài khoản thử

Cần Docker (cho Redis), Node.js, và file `be/.env` đã điền đủ thông tin (MySQL, Redis, Gmail, Cloudinary).

Mở 3 terminal riêng:

```
# 1. Redis
cd D:\Remote\jewelry-shop
docker compose up -d

# 2. Backend (cổng 4000)
cd D:\Remote\jewelry-shop\be
npm run start:dev

# 3. Frontend (cổng 3000)
cd D:\Remote\jewelry-shop\fe
npm run dev
```

Sau đó mở http://localhost:3000.

| Vai trò | Số điện thoại | Mật khẩu | Trang |
|---|---|---|---|
| Admin | `0900000001` | `Admin@123456` | `/admin` |
| User | `0900000002` | `User@123456` | `/user` |

Lệnh hữu ích trong `be`:
- `npm run seed:admin -- <sđt> <email> <mật khẩu>`: tạo hoặc nâng quyền admin.
- `npm run seed:catalog` và `npm run seed:shop`: nạp dữ liệu mẫu (sản phẩm, khuyến mại, vận chuyển, thông tin chuyển khoản mẫu); thêm `-- --remove` để gỡ.
- `npm run seed:locations`: nạp địa giới hành chính.
- `npm run test:e2e` (không chạy song song với lần chạy khác) và `npm test`.

Lệnh trong `fe`: `npm test`, `npm run lint`, `npm run build`.

---

## 8. Tài liệu trong dự án

| File | Nội dung |
|---|---|
| `D:\Remote\claude.md` | Quy ước bắt buộc cho backend và frontend |
| `D:\Remote\skill.md` | Quy trình làm việc theo nhóm agent và các quyết định đã chốt |
| `D:\Remote\jewelry-shop\API_CONTRACT.md` | Hợp đồng API xác thực (bản 2: OTP, blacklist) |
| `D:\Remote\jewelry-shop\API_CONTRACT_PHASE2.md` | Hợp đồng API danh mục và sản phẩm |
| `D:\Remote\jewelry-shop\API_CONTRACT_PHASE3.md` | Hợp đồng API giỏ hàng, yêu thích, địa chỉ |
| `D:\Remote\jewelry-shop\API_CONTRACT_PHASE4.md` | Hợp đồng API đặt hàng, thanh toán, quản lý đơn |
| `D:\Remote\jewelry-shop\be\database\` | File SQL tạo bảng, khóa ngoại và các thay đổi (`changes/001` đến `005`) |
