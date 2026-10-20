# API Contract - Giai đoạn 4: Đặt hàng, Thanh toán, Quản lý đơn hàng

Do leader chốt. be, fe, test đều bám theo file này. Muốn đổi thì báo leader, không tự sửa. Quy ước chung theo `API_CONTRACT.md` bản 2; sản phẩm/giỏ hàng theo `API_CONTRACT_PHASE2.md` và `API_CONTRACT_PHASE3.md`. File này chỉ bổ sung.

Schema: đã thêm bằng `be/database/changes/005_orders_snapshots.sql` (đã áp vào DB, entity cần thêm cột): `orders.shippingMethodName`, `orders.paidAt`, `orders.cancelReason`, `order_items.imageUrl`. Không đổi schema nào khác; cần đổi thì báo leader.

- Tiền là số nguyên VND. Mọi endpoint cần token trừ khi ghi khác. `/admin/**` cần role admin. Khách chỉ thấy đơn của chính mình (đơn của người khác: 404).
- Phương thức thanh toán giai đoạn này: `cod`, `bank_transfer`. Thanh toán qua cổng bên thứ ba (môi trường sandbox) sẽ làm ở giai đoạn sau; đừng cố dựng sẵn, nhưng giữ logic thanh toán tách riêng trong module/service riêng (`payments`) để sau này thêm nhà cung cấp mà không sửa luồng đơn hàng.

## Quy ước nghiệp vụ đã chốt

- **Trừ tồn kho ngay khi đặt hàng**, hoàn lại tồn kho khi đơn bị hủy (đúng một lần).
- Giá chốt theo giá hiện tại lúc đặt (đã gồm khuyến mại đang hiệu lực), lưu vào `order_items.unitPrice`. Không bao giờ tin giá do client gửi.
- Khách chỉ hủy được đơn khi trạng thái `pending`. Admin hủy được khi `pending`, `confirmed`, `preparing`.
- Luồng trạng thái: `pending` -> `confirmed` -> `preparing` -> `shipping` -> `delivered`; `cancelled` từ `pending`/`confirmed`/`preparing`. Mỗi lần chỉ đi tới đúng bước kế tiếp, không nhảy cóc, không đi lùi; `delivered` và `cancelled` là trạng thái cuối. Sai: 409 `INVALID_STATUS_TRANSITION`.
- COD: khi đơn chuyển sang `delivered` tự đặt `paymentStatus = paid`, `paidAt = now`. Chuyển khoản: admin xác nhận đã nhận tiền bằng endpoint thanh toán.
- Khi `delivered`: cộng `soldCount` của sản phẩm theo số lượng đã bán (một lần, trong cùng transaction).
- Đơn đã hủy mà đã `paid` (chuyển khoản): chỉ ghi nhận hủy, hoàn tiền xử lý ngoài hệ thống (ghi chú trong lịch sử); không tự đổi `paymentStatus`.
- Mã đơn: `LG` + `yyyyMMdd` (giờ Việt Nam) + `-` + 6 chữ số ngẫu nhiên (`crypto.randomInt`), ví dụ `LG20261017-483920`; duy nhất, bắt duplicate key và thử lại tối đa 5 lần.

## Mã lỗi bổ sung

`EMPTY_ORDER` (400: không chọn dòng nào), `SHIPPING_METHOD_UNAVAILABLE` (400: phương thức không tồn tại hoặc đã tắt), `PRICE_CHANGED` (409: giá/tổng tiền đổi so với `expectedTotal`, kèm `total`, `subtotal`, `shippingFee` mới), `INVALID_STATUS_TRANSITION` (409), `ORDER_NOT_CANCELLABLE` (409: đơn không còn ở trạng thái cho phép khách hủy), `INSUFFICIENT_STOCK` (409, dùng lại, kèm `shortages: [{ variantId, productName, size, available, requested }]`), `ITEM_UNAVAILABLE` (409, dùng lại). Địa chỉ không tồn tại hoặc không phải của người dùng: 404 `NOT_FOUND`.

## Phương thức vận chuyển

- `GET /shipping-methods` (cần token) -> `[{ id, name, description, fee }]` các mục `isActive`, sắp theo `fee` tăng dần.
- Admin `/admin/shipping-methods`: `GET` (cả mục đã tắt), `POST { name (2..100), description?, fee (nguyên >= 0), isActive? }` -> 201, `PATCH /:id`, `DELETE /:id` (đã có đơn tham chiếu thì 409 `RESOURCE_IN_USE`, gợi ý tắt thay vì xóa). Phí vận chuyển của đơn đã tạo không đổi khi sửa phương thức (đã lưu snapshot ở đơn).

## Thông tin chuyển khoản

Lưu trong `site_settings` (cột `setting_key`, `value`) với các khóa: `bank.bankName`, `bank.accountNumber`, `bank.accountHolder`, `bank.transferNote` (mẫu nội dung, dùng `{orderCode}` làm chỗ giữ mã đơn, mặc định `{orderCode}`).
- `GET /payment-info/bank-transfer` (cần token) -> `{ bankName, accountNumber, accountHolder, transferNote }`.
- Admin `GET /admin/settings/bank-transfer` và `PUT /admin/settings/bank-transfer` body `{ bankName (1..100), accountNumber (4..30, chỉ chữ số hoặc khoảng trắng), accountHolder (1..100), transferNote (1..100, bắt buộc chứa `{orderCode}`) }`. Chỉ chấp nhận đúng các khóa này (whitelist), không cho ghi khóa tùy ý.
- Dữ liệu mẫu tạm do script nạp (xem mục cuối): ngân hàng, số tài khoản, chủ tài khoản đều ghi rõ là MẪU để admin sửa sau trong trang cài đặt.

## Đặt hàng (khách)

### POST /orders/preview
Xem trước toàn bộ đơn (dùng đúng phép tính của đặt hàng thật, không ghi gì vào DB). Body `{ itemIds: number[] (1..50, id dòng giỏ), shippingMethodId? }`.
- 200: `{ items: [{ cartItemId, variantId, productId, productName, productSlug, productCode, size, imageUrl, unitPrice, quantity, lineTotal }], subtotal, shippingFee, total, issues: [{ cartItemId, issue: "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK", available? }] }`. `shippingFee` là 0 nếu chưa chọn phương thức. `issues` rỗng thì đặt được. Dòng không thuộc giỏ của người dùng bị bỏ qua. Không chọn dòng hợp lệ nào: 400 `EMPTY_ORDER`.

### POST /orders
Header `Idempotency-Key: <uuid>` (bắt buộc, do fe tạo MỖI LẦN mở trang thanh toán). Body:
```json
{ "itemIds": [1, 2], "addressId": 5, "shippingMethodId": 1,
  "paymentMethod": "cod", "note": "Giao giờ hành chính", "expectedTotal": 38790000 }
```
- `note` tối đa 500 ký tự (tùy chọn). `expectedTotal` là tổng tiền mà khách vừa thấy ở bước xem lại (bắt buộc); nếu tổng thực tế khác: 409 `PRICE_CHANGED` kèm số mới, KHÔNG tạo đơn.
- 201: đơn đầy đủ (cùng dạng `GET /orders/:code`).
- Trong MỘT transaction DB: kiểm tra địa chỉ thuộc người dùng, phương thức vận chuyển đang bật, từng dòng giỏ (sản phẩm/biến thể/danh mục đang bán), tính giá và tổng; trừ tồn kho bằng câu lệnh nguyên tử cho từng biến thể (`UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?`, kiểm tra số dòng bị ảnh hưởng, xử lý theo thứ tự `variantId` tăng dần để tránh deadlock); thiếu tồn kho ở bất kỳ biến thể nào thì ROLLBACK toàn bộ và trả 409 `INSUFFICIENT_STOCK` kèm `shortages`; tạo `orders` (snapshot: tên/SĐT người nhận, tên tỉnh/xã, địa chỉ chi tiết từ địa chỉ đã chọn, `shippingMethodName`, `shippingFee`, `subtotal`, `total`), `order_items` (snapshot `productName`, `productCode`, `size`, `imageUrl` ảnh đại diện, `unitPrice`, `quantity`, `lineTotal`), dòng đầu của `order_status_history` (`pending`, `changedById` = người đặt, note "Đặt hàng"); xóa các dòng giỏ đã đặt khỏi giỏ.
- Idempotency: key lưu Redis `jewelry:idem:order:<userId>:<key>` (TTL 600 giây) bằng `SET NX` trước khi xử lý. Cùng key gửi lại (bấm đúp, thử lại): trả đúng đơn đã tạo (200) nếu đã xong, hoặc 409 `REQUEST_IN_PROGRESS` nếu đang xử lý. Lỗi xảy ra thì xóa key để khách thử lại được. Redis lỗi: vẫn xử lý bình thường (chỉ mất chống đặt trùng, ghi log).
- Nếu `paymentMethod = bank_transfer` thì response có thêm `paymentInstructions: { bankName, accountNumber, accountHolder, transferContent, amount }` (`transferContent` = mẫu nội dung với `{orderCode}` thay bằng mã đơn; `amount` = `total`); với `cod` thì `paymentInstructions: null`.

### GET /orders?page&pageSize&status
Đơn của chính mình, mới nhất trước, `pageSize` mặc định 10, tối đa 50. Item: `{ code, createdAt, status, paymentMethod, paymentStatus, total, itemCount, items: [{ productName, size, imageUrl, quantity }] (tối đa 3 mục đầu) }`. Lấy mục sản phẩm bằng truy vấn gộp (batch theo orderId), không N+1.

### GET /orders/:code
Chi tiết: `{ code, createdAt, status, paymentMethod, paymentStatus, paidAt, cancelReason, note, receiver: { name, phone, province, ward, addressDetail }, shippingMethodName, subtotal, shippingFee, total, items: [{ productName, productCode, productSlug?, size, imageUrl, unitPrice, quantity, lineTotal }], history: [{ status, note, createdAt }], paymentInstructions }` (`paymentInstructions` chỉ khi `bank_transfer` và `paymentStatus = unpaid` và đơn chưa hủy, ngược lại null). `history` theo thời gian tăng dần. Không trả `changedById` ra ngoài. 404 nếu không phải đơn của mình.

### POST /orders/:code/cancel
Body `{ reason? (tối đa 255) }`. Chỉ khi `pending`, ngược lại 409 `ORDER_NOT_CANCELLABLE`. Transaction: khóa dòng đơn (`SELECT ... FOR UPDATE`), kiểm tra lại trạng thái, đổi `cancelled`, ghi `cancelReason`, thêm dòng lịch sử, hoàn tồn kho từng biến thể bằng `UPDATE ... SET stock = stock + ?` (đúng một lần; hai request hủy song song chỉ một thành công, cái còn lại 409). 200: chi tiết đơn.

## Quản lý đơn hàng (admin)

- `GET /admin/orders?page&pageSize&q&status&paymentStatus&from&to`: `q` tìm theo mã đơn, tên người nhận, SĐT người nhận (khớp một phần, không phân biệt hoa thường); `from`/`to` là ngày `yyyy-MM-dd` (giờ Việt Nam, gồm cả ngày `to`); `pageSize` mặc định 20, tối đa 100. Item: `{ id, code, createdAt, receiverName, receiverPhone, status, paymentMethod, paymentStatus, total, itemCount }`. Mới nhất trước.
- `GET /admin/orders/:id`: chi tiết đầy đủ như khách (không có `paymentInstructions`) cộng `customer: { id, fullName, phone, email }` và `history` kèm `changedByName` (tên người đổi, từ bảng users) ; `changedBy` null thì "Hệ thống".
- `PATCH /admin/orders/:id/status` body `{ status, note? (tối đa 255) }`: theo luồng trạng thái ở trên. Khóa dòng đơn, kiểm tra lại, ghi lịch sử (`changedById` = admin). `cancelled` thì hoàn tồn kho (như khách hủy; `note` ghi vào `cancelReason`). `delivered` thì áp dụng quy tắc COD và `soldCount`. 200: chi tiết đơn.
- `PATCH /admin/orders/:id/payment` body `{ paymentStatus: "paid" | "unpaid", note? }`: chỉ cho đơn `bank_transfer` chưa hủy (COD thì 409 `INVALID_STATUS_TRANSITION` với message rõ). `paid` đặt `paidAt = now`, `unpaid` xóa `paidAt`. Ghi một dòng lịch sử với trạng thái đơn hiện tại và note nêu thay đổi thanh toán. 200: chi tiết đơn.
- In hóa đơn: không cần endpoint riêng, fe in từ dữ liệu `GET /admin/orders/:id`.

## Dữ liệu mẫu

Script `npm run seed:shop` (trong `be`, idempotent, chèn thẳng DB như `seed-catalog.mjs`): phương thức vận chuyển mẫu (`Giao hàng tiêu chuẩn` 30.000đ, `Giao hàng nhanh` 60.000đ) và thông tin chuyển khoản MẪU trong `site_settings` (`bank.bankName` = "Ngân hàng MẪU - đổi trong Cài đặt", `bank.accountNumber` = "0123456789", `bank.accountHolder` = "CONG TY LUMIERE GEMS (MAU)", `bank.transferNote` = "{orderCode}"). Chạy lại không đè giá trị admin đã sửa (chỉ chèn nếu chưa có khóa/tên). Cờ `--remove` chỉ xóa phương thức vận chuyển mẫu chưa có đơn.

## Frontend

### Khách
- Trang `/cart`: nút "Thanh toán" chuyển tới `/checkout` mang theo các dòng đã chọn (lưu trong store/sessionStorage, mất thì quay về `/cart`).
- `/checkout` (private): (1) xem lại toàn bộ sản phẩm, số lượng, đơn giá, thành tiền (từ `POST /orders/preview`, không tự tính giá ở fe); (2) chọn địa chỉ nhận hàng từ sổ địa chỉ, mặc định chọn sẵn địa chỉ mặc định, có lối thêm địa chỉ mới (chưa có địa chỉ thì chặn đặt hàng và hướng dẫn thêm); (3) chọn phương thức vận chuyển (hiện phí), tổng cập nhật qua preview; (4) chọn thanh toán COD hoặc chuyển khoản (chuyển khoản hiện lưu ý sẽ thấy thông tin chuyển khoản sau khi đặt); (5) ghi chú; (6) tóm tắt tạm tính, phí vận chuyển, tổng; (7) nút "Đặt hàng" có loading, khóa khi đang gửi, tạo `Idempotency-Key` mới mỗi lần mở trang, gửi `expectedTotal`. `PRICE_CHANGED`: cập nhật preview, toast báo tổng mới và yêu cầu bấm đặt lại. `INSUFFICIENT_STOCK`: toast nêu sản phẩm thiếu và dẫn về `/cart`. Đặt thành công: chuyển `/user/orders/<code>` (xóa dòng đã đặt khỏi store giỏ, cập nhật số trên header).
- `/user/orders`: danh sách có tab/lọc theo trạng thái, phân trang, thẻ đơn (mã, ngày, trạng thái bằng nhãn màu, tổng tiền, tối đa 3 sản phẩm), empty state.
- `/user/orders/[code]`: tiến trình trạng thái (timeline từ `history`), sản phẩm, địa chỉ nhận, phương thức vận chuyển và thanh toán, tổng tiền; nếu có `paymentInstructions` thì hiện khung thông tin chuyển khoản (ngân hàng, số tài khoản có nút sao chép, chủ tài khoản, số tiền, nội dung chuyển khoản có nút sao chép); nút "Hủy đơn" (chỉ khi `pending`, xác nhận bằng swal, nhập lý do tùy chọn). Banner thành công khi vừa đặt xong.
- Điều hướng: thêm "Đơn hàng của tôi" vào trang `/user` và menu tài khoản.

### Admin
- `/admin/orders`: bảng lọc (ô tìm `useDebounce` 500ms, trạng thái, thanh toán, khoảng ngày), phân trang, nhãn trạng thái, mobile dạng thẻ.
- `/admin/orders/[id]`: chi tiết, khách hàng, timeline, các nút chuyển trạng thái chỉ hiện bước hợp lệ kế tiếp và "Hủy đơn" khi cho phép (xác nhận bằng swal, có ô ghi chú), nút "Xác nhận đã thanh toán" cho chuyển khoản, nút "In hóa đơn".
- `/admin/orders/[id]/invoice`: trang hóa đơn in được (kiểu in `@media print`, ẩn điều hướng, khổ A4, thông tin cửa hàng lấy từ hằng số/cài đặt hiện có).
- `/admin/shipping-methods`: CRUD phương thức vận chuyển (khung CRUD dùng chung hiện có).
- `/admin/settings`: form thông tin chuyển khoản (bốn trường, kiểm tra `{orderCode}`).
- Bật các mục Đơn hàng, Vận chuyển, Cài đặt trong sidebar.

Quy ước giao diện giữ nguyên: toast cho kết quả, `confirmAction` (SweetAlert2) cho xác nhận, token ở `sessionStorage`, trạng thái loading/empty/error, responsive, tiếng Việt.
