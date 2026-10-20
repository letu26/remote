# API Contract - Giai đoạn 7: Khuyến mại, Quản lý khách hàng, Thống kê

Do leader chốt. be, fe, test đều bám theo file này. Muốn đổi thì báo leader, không tự sửa. Quy ước chung theo `API_CONTRACT.md` bản 2, `API_CONTRACT_PHASE2.md` (phân trang, giá khuyến mại), `API_CONTRACT_PHASE4.md` (đơn hàng). File này chỉ bổ sung. Toàn bộ endpoint dưới đây thuộc `/admin/**` (cần token role admin; 401/403 như hợp đồng chính).

Schema: không đổi bảng nào, chỉ thêm chỉ mục `idx_order_status_history_status_createdAt` bằng `be/database/changes/008_stats_index.sql` (đã áp vào DB). Cần đổi schema thì dừng và báo leader.

- Tiền là số nguyên VND. Mọi thời gian trả client là ISO có hậu tố Z (UTC). Ngày trong tham số (`from`, `to`) là `yyyy-MM-dd` theo **giờ Việt Nam (UTC+7)**, gồm cả ngày `to`.
- Kết nối DB dùng `timezone: 'Z'`: mọi `Date` đọc/ghi theo UTC. Gom nhóm theo ngày/tháng/năm Việt Nam bằng cách cộng 7 giờ vào mốc UTC trong SQL (không dùng `CONVERT_TZ` vì máy chủ DB có thể không có bảng múi giờ).

## Mã lỗi bổ sung

`CANNOT_MODIFY_SELF` (409: admin không tự khóa hoặc tự đổi quyền của chính mình), `CANNOT_LOCK_ADMIN` (409: không khóa được tài khoản admin), `LAST_ADMIN` (409: không thể hạ quyền admin cuối cùng). Dùng lại: `NOT_FOUND`, `VALIDATION_ERROR`.

## Khuyến mại: `/admin/promotions`

Bảng `promotions` (mỗi dòng là một khuyến mại cho MỘT sản phẩm). Giá hiển thị cho khách đã tính từ bảng này (mức giảm CAO NHẤT trong các khuyến mại `isActive` đang hiệu lực `startsAt <= now <= endsAt`), logic đó giữ nguyên; giai đoạn này chỉ thêm phần quản lý. Hai khuyến mại cùng lúc cho một sản phẩm được phép (lấy mức giảm cao nhất).
- Trạng thái tính ở server, tại thời điểm gọi: `disabled` (`isActive = 0`), `upcoming` (`startsAt > now`), `expired` (`endsAt < now`), `active` (còn lại). Thứ tự ưu tiên: `disabled` trước, rồi `expired`, `upcoming`, `active`.
- `GET /admin/promotions?page&pageSize&q&status&productId` (`pageSize` mặc định 20, tối đa 100; `q` khớp một phần, không phân biệt hoa thường, trong tên khuyến mại, tên sản phẩm, mã sản phẩm; `status` là một trong bốn trạng thái; mới tạo trước). Item: `{ id, name, productId, productCode, productName, discountPercent, startsAt, endsAt, isActive, status, createdAt }`. Lấy tên/mã sản phẩm bằng JOIN, không N+1; lọc theo `status` phải thực hiện ở SQL (không lọc trong bộ nhớ sau khi phân trang).
- `POST /admin/promotions` body `{ name (1..150), productIds: number[] (1..100, không trùng), discountPercent (nguyên 1..90), startsAt, endsAt, isActive? (mặc định true) }` -> 201 `{ created, items: [item như trên] }`. `startsAt`/`endsAt` là chuỗi ISO 8601 có múi giờ (hậu tố `Z` hoặc `+07:00`), phải `startsAt < endsAt`, nếu không 400 `VALIDATION_ERROR` (`details[].field = endsAt`). `productIds` có id không tồn tại: 400 (`details[].field = productIds`, message nêu id). Tạo nhiều dòng trong MỘT transaction (một dòng lỗi thì không tạo gì).
- `PATCH /admin/promotions/:id` các trường tùy chọn: `name`, `discountPercent`, `startsAt`, `endsAt`, `isActive` (không đổi `productId`; muốn đổi sản phẩm thì xóa tạo lại). Cùng quy tắc kiểm tra, kiểm tra `startsAt < endsAt` với giá trị sau khi gộp với dữ liệu hiện có. 200 item.
- `DELETE /admin/promotions/:id` -> 204.
- Bật/tắt nhanh dùng `PATCH { isActive }`.

## Quản lý khách hàng: `/admin/customers`

Danh sách và chi tiết tài khoản. KHÔNG bao giờ trả `passwordHash` hay token.
- `GET /admin/customers?page&pageSize&q&status&role` (`pageSize` mặc định 20, tối đa 100; `q` khớp một phần không phân biệt hoa thường trong họ tên, số điện thoại, email; `status` là `active` | `locked`; `role` là `user` | `admin`, mặc định gồm cả hai; mới đăng ký trước). Item: `{ id, fullName, phone, email, role, status, createdAt, orderCount, totalSpent, lastOrderAt }`, trong đó `orderCount` là số đơn không bị hủy, `totalSpent` là tổng `total` của các đơn `delivered`, `lastOrderAt` là thời điểm đặt đơn gần nhất (null nếu chưa có). Tính chỉ số của cả trang bằng MỘT truy vấn gộp theo `userId IN (...)` (không N+1).
- `GET /admin/customers/:id` -> `{ ...như item, addressCount, reviewCount, wishlistCount, recentOrders: [{ id, code, createdAt, status, paymentStatus, total, itemCount }] (10 đơn gần nhất; `id` là id đơn để liên kết tới `/admin/orders/<id>`) }`. Không tồn tại: 404.
- `PATCH /admin/customers/:id/status` body `{ status: "active" | "locked", reason? (tối đa 255) }`. Khóa: chỉ tài khoản role `user` (`CANNOT_LOCK_ADMIN` nếu là admin; tự khóa mình: `CANNOT_MODIFY_SELF`). Mở khóa tài khoản nào cũng được. Khóa có hiệu lực ngay (guard kiểm tra trạng thái mỗi request, đăng nhập mới bị `ACCOUNT_LOCKED`); đặt lại cùng giá trị thì vẫn 200. 200: item (cùng dạng danh sách). Ghi log (id admin, id khách, hành động; KHÔNG ghi dữ liệu nhạy cảm).
- `PATCH /admin/customers/:id/role` body `{ role: "user" | "admin" }`. Không tự đổi quyền của chính mình (`CANNOT_MODIFY_SELF`). Hạ quyền admin cuối cùng (còn đúng một admin `active`): `LAST_ADMIN`. Kiểm tra số admin và cập nhật trong MỘT transaction có khóa (hai admin cùng hạ quyền nhau song song không được làm hệ thống không còn admin nào). Đổi quyền xong phải **thu hồi mọi token cũ** của người đó (ghi blacklist `all_before` như đổi mật khẩu, trong cùng transaction) để quyền mới áp dụng ngay (vì role nằm trong token). 200: item. Vai trò nhân viên (`manager`) chưa có ở giai đoạn này.
- `GET /admin/orders` (đã có) thêm tham số lọc `userId` để xem lịch sử mua của một khách; cùng quy tắc phân trang/trường như hiện có.

## Thống kê: `/admin/stats/**`

Tất cả nhận `from`, `to` (ngày `yyyy-MM-dd` giờ Việt Nam, gồm cả ngày `to`). Mặc định `to` = hôm nay (giờ VN), `from` = `to` trừ 29 ngày. `from > to`, sai định dạng hoặc khoảng quá 366 ngày: 400 `VALIDATION_ERROR` (`details[].field`).

**Quy ước tính doanh thu:** doanh thu là tổng `total` của các đơn đã **giao thành công** (`delivered`), tính theo ngày đơn chuyển sang `delivered` (thời điểm dòng lịch sử `status = 'delivered'` của đơn, giờ VN). Đơn đã hủy không tính. Một đơn chỉ được tính một lần (mỗi đơn có tối đa một dòng lịch sử `delivered`).

- `GET /admin/stats/overview?from&to` ->
```json
{
  "range": { "from": "2026-09-19", "to": "2026-10-18" },
  "pendingOrders": 3,
  "today": { "orders": 2, "revenue": 5800000 },
  "thisMonth": { "orders": 40, "revenue": 120000000 },
  "inRange": { "orders": 55, "revenue": 160000000, "averageOrderValue": 2909091 },
  "totalCustomers": 120,
  "totalProducts": 14,
  "lowStockProducts": 2
}
```
`pendingOrders` là số đơn `pending` hiện tại (không phụ thuộc khoảng ngày). `today` và `thisMonth` tính theo ngày/tháng hiện tại giờ VN (không phụ thuộc `from`/`to`), `orders` là số đơn giao thành công trong kỳ, `revenue` như quy ước. `inRange` là kỳ `from..to`; `averageOrderValue` = `revenue / orders` làm tròn, 0 nếu không có đơn. `totalCustomers` là số tài khoản role `user` (mọi trạng thái), `totalProducts` là số sản phẩm `isActive`, `lowStockProducts` là số sản phẩm `isActive` có ít nhất một biến thể đang bán (`isActive`) với tồn kho `<= 5` (ngưỡng mặc định 5).
- `GET /admin/stats/revenue?granularity=day|month|year&from&to` (mặc định `day`) -> `[{ period, orders, revenue }]` theo quy ước doanh thu, `period` là `yyyy-MM-dd` | `yyyy-MM` | `yyyy`, sắp tăng dần, **điền đủ các kỳ không có đơn bằng 0** trong khoảng (kỳ đầu/cuối cắt theo `from`/`to` nhưng nhóm tháng/năm lấy trọn kỳ chứa ngày đó nằm trong khoảng ngày được chọn: chỉ tính các đơn có ngày giao nằm trong `from..to`). Giới hạn số kỳ trả về tối đa 366 (ngày), 60 (tháng), 20 (năm); vượt thì 400.
- `GET /admin/stats/orders-by-status?from&to` -> `{ pending, confirmed, preparing, shipping, delivered, cancelled }` (số nguyên, đủ 6 khóa, 0 nếu không có) tính trên các đơn có `createdAt` trong khoảng, theo trạng thái HIỆN TẠI của đơn.
- `GET /admin/stats/top-products?from&to&limit` (`limit` mặc định 10, tối đa 50) -> `[{ productCode, productName, quantity, revenue }]` sản phẩm bán chạy: cộng `quantity` và `lineTotal` của `order_items` thuộc các đơn giao thành công trong khoảng (theo ngày giao), nhóm theo `productCode`, sắp theo `quantity` giảm dần rồi `revenue` giảm dần rồi `productCode`. Có thêm `productId` và `productSlug` nếu sản phẩm còn tồn tại (JOIN theo biến thể, null nếu đã bị xóa).
- `GET /admin/stats/low-stock?threshold&limit` (`threshold` mặc định 5, 0..1000; `limit` mặc định 20, tối đa 100) -> `[{ productId, productCode, productName, variantId, sku, size, stock }]` các biến thể đang bán của sản phẩm `isActive` có `stock <= threshold`, sắp theo `stock` tăng dần rồi `productCode`.
- `GET /admin/stats/top-customers?from&to&limit` (`limit` mặc định 10, tối đa 50) -> `[{ userId, fullName, phone, orders, totalSpent }]` khách mua nhiều nhất theo tổng tiền các đơn giao thành công trong khoảng (theo ngày giao), sắp theo `totalSpent` giảm dần rồi `orders` giảm dần rồi `userId`. Tên/SĐT lấy bằng JOIN.
- Mọi truy vấn thống kê là truy vấn gộp (GROUP BY) có chỉ mục hỗ trợ, không lặp theo từng bản ghi, và dùng tham số hóa.

## Frontend (admin)

- **Dashboard `/admin`** thay trang tạm: bộ chọn khoảng ngày (7, 30, 90 ngày gần nhất và tùy chọn từ-đến, giới hạn 366 ngày), thẻ chỉ số (đơn chờ xác nhận có liên kết sang `/admin/orders?status=pending`, doanh thu hôm nay, doanh thu tháng này, số khách, số sản phẩm, sản phẩm sắp hết hàng, doanh thu và số đơn trong kỳ, giá trị đơn trung bình), biểu đồ doanh thu theo ngày/tháng/năm có chuyển đổi (vẽ bằng SVG tự viết, không thêm thư viện biểu đồ; hover/focus hiện chú thích số liệu từng kỳ; có bảng số liệu thay thế cho trình đọc màn hình; trục tiền rút gọn đơn vị triệu/tỷ), đơn hàng theo trạng thái (thanh ngang hoặc biểu đồ tròn kèm số, màu theo nhãn trạng thái hiện có), bảng sản phẩm bán chạy (liên kết sang sản phẩm), bảng tồn kho thấp (liên kết sang trang sửa sản phẩm), bảng khách mua nhiều (liên kết sang chi tiết khách). Mỗi khối tự có skeleton/lỗi/empty (một khối lỗi không làm hỏng cả trang); bộ chọn khoảng ngày đồng bộ lên URL. Hiển thị tiền định dạng VND; ngày giờ theo giờ địa phương của trình duyệt (chuyển từ ISO UTC).
- **`/admin/promotions`**: bảng có tìm kiếm debounce 500ms, lọc theo trạng thái (đang chạy, sắp tới, đã hết hạn, đã tắt), phân trang; nhãn màu theo trạng thái; thêm khuyến mại trong modal: tên, chọn NHIỀU sản phẩm (ô tìm kiếm sản phẩm gọi `/admin/products` có debounce, chọn nhiều, hiện số đã chọn, tối đa 100), phần trăm giảm (1..90), thời gian bắt đầu/kết thúc (nhập giờ địa phương, gửi lên ISO có múi giờ), bật/tắt; hiển thị trước giá sau giảm của sản phẩm đầu tiên được chọn (chỉ minh họa, tính từ giá niêm yết đang có); sửa (không đổi sản phẩm), bật/tắt nhanh, xóa bằng swal; cảnh báo khi một sản phẩm đã có khuyến mại khác trùng thời gian ("sẽ lấy mức giảm cao nhất"). Bộ lọc đồng bộ lên URL.
- **`/admin/customers`** (danh sách có tìm kiếm debounce 500ms, lọc trạng thái, lọc vai trò, phân trang, số đơn, tổng chi tiêu, nhãn khóa/admin) và **`/admin/customers/[id]`** (thông tin, thống kê, 10 đơn gần nhất có liên kết `/admin/orders/<id>` và liên kết "Xem tất cả đơn" tới `/admin/orders?userId=<id>`, nút Khóa/Mở khóa dùng swal có ô lý do, nút Đổi quyền dùng swal cảnh báo mạnh nêu hệ quả; ẩn hoặc vô hiệu hóa nút không hợp lệ: không khóa/đổi quyền chính mình, không khóa admin; xử lý `CANNOT_MODIFY_SELF`, `CANNOT_LOCK_ADMIN`, `LAST_ADMIN` bằng toast rõ nghĩa). Trang `/admin/orders` hiện có hỗ trợ tham số `userId` trên URL (hiện nhãn "Đơn của <tên khách>" khi lọc theo khách, có nút bỏ lọc).
- Sidebar: bật mục Khách hàng, Khuyến mại, Thống kê (nếu chưa có thì "Tổng quan" chính là dashboard; mục "Thống kê" có thể trỏ về `/admin`); bỏ nhãn "Sắp có" cho các mục đã làm.
- Quy ước giao diện giữ nguyên: toast cho kết quả, `confirmAction` (SweetAlert2) cho xác nhận, token ở `sessionStorage`, trạng thái loading/empty/error, responsive, tiếng Việt, gọn theo hệ thiết kế hiện có, không thêm thư viện biểu đồ.
