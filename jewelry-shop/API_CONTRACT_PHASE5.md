# API Contract - Giai đoạn 5: Đánh giá sản phẩm

Do leader chốt. be, fe, test đều bám theo file này. Muốn đổi thì báo leader, không tự sửa. Quy ước chung theo `API_CONTRACT.md` bản 2 (định dạng lỗi, JWT, blacklist, validate), `API_CONTRACT_PHASE2.md` (sản phẩm, phân trang) và `API_CONTRACT_PHASE4.md` (đơn hàng). File này chỉ bổ sung.

Schema: bảng `reviews` đã có sẵn (`userId`, `productId`, `orderItemId`, `rating`, `comment`, `isHidden`). Đã thêm bằng `be/database/changes/006_reviews_indexes.sql` (đã áp vào DB): khóa unique `(userId, productId)` (mỗi khách chỉ đánh giá một sản phẩm một lần) và chỉ mục `(productId, isHidden, createdAt)`. Không đổi schema khác; cần đổi thì báo leader.

## Quy tắc nghiệp vụ đã chốt

- **Chỉ người đã mua và đã nhận hàng mới được đánh giá**: người dùng phải có ít nhất một dòng đơn hàng (`order_items`) của sản phẩm đó thuộc đơn của chính mình ở trạng thái `delivered`. `orderItemId` lưu vào đánh giá là dòng của đơn `delivered` GẦN NHẤT của người dùng chứa sản phẩm đó (mọi biến thể/size của sản phẩm đều tính).
- Mỗi người dùng chỉ có **một đánh giá cho một sản phẩm** (có thể sửa hoặc xóa của chính mình rồi viết lại). Phải an toàn khi hai request chạy song song: dựa vào khóa unique và bắt duplicate key, trả 409.
- `rating`: số nguyên 1..5. `comment`: tùy chọn, sau khi cắt khoảng trắng đầu/cuối tối đa 1000 ký tự; rỗng thì lưu `null`.
- Đánh giá bị admin ẩn (`isHidden = 1`) KHÔNG hiện công khai và KHÔNG tính vào điểm trung bình hay số lượt đánh giá; chủ đánh giá vẫn thấy đánh giá của mình ở endpoint "của tôi" (kèm cờ đã bị ẩn) nhưng không sửa được cho tới khi admin hiện lại (sửa khi bị ẩn: 403 `REVIEW_HIDDEN`).
- `products.avgRating` (làm tròn 2 chữ số) và `products.reviewCount` luôn khớp với các đánh giá đang hiển thị. Cập nhật ngay trong CÙNG transaction với mọi thao tác tạo, sửa điểm, xóa, ẩn, hiện, bằng MỘT câu `UPDATE` tính lại từ bảng `reviews` (không đọc-sửa-ghi trong code); không có đánh giá nào hiển thị thì `avgRating = 0`, `reviewCount = 0`. Tổng hợp này phục vụ sắp xếp "được đánh giá cao" ở danh sách sản phẩm (đã có).
- Tên người đánh giá hiển thị công khai được che bớt để bảo vệ riêng tư: từ đầu của họ tên giữ nguyên, các từ sau chỉ lấy chữ cái đầu kèm dấu chấm; họ tên một từ thì lấy chữ cái đầu cộng `***`. Ví dụ `Trần Tiến Dũng` -> `Trần T. D.`, `Dũng` -> `D***`. Không trả email, số điện thoại, id người dùng ra công khai.

## Mã lỗi bổ sung

`REVIEW_NOT_ALLOWED` (403: chưa mua hoặc chưa nhận hàng sản phẩm này), `REVIEW_ALREADY_EXISTS` (409), `REVIEW_HIDDEN` (403: đánh giá đang bị ẩn nên không sửa/xóa được... xem từng endpoint), `NOT_FOUND` (404) dùng lại. Sản phẩm không tồn tại hoặc đã ẩn: 404.

## API công khai

### GET /products/:slug/reviews?page&pageSize&rating
- `pageSize` mặc định 10, tối đa 50. `rating` (1..5, tùy chọn) lọc theo số sao. Mới nhất trước (`createdAt` giảm dần, rồi `id` giảm dần). Chỉ đánh giá `isHidden = 0` của sản phẩm đang bán (404 nếu sản phẩm không tồn tại hoặc ẩn).
- 200:
```json
{
  "summary": { "avgRating": 4.5, "reviewCount": 12, "distribution": { "1": 0, "2": 1, "3": 1, "4": 3, "5": 7 } },
  "items": [{ "id": 1, "rating": 5, "comment": "Rất đẹp", "reviewerName": "Trần T. D.", "createdAt": "2026-10-17T02:57:29.000Z", "updatedAt": "2026-10-17T02:57:29.000Z", "isMine": false }],
  "page": 1, "pageSize": 10, "total": 12, "totalPages": 2
}
```
- `summary` luôn tính trên TẤT CẢ đánh giá hiển thị của sản phẩm (không phụ thuộc bộ lọc `rating`/trang); `distribution` lấy bằng một truy vấn gộp `GROUP BY rating`. `total` là số đánh giá khớp bộ lọc. `isMine` là `true` nếu request có token hợp lệ và đánh giá là của người đó (token tùy chọn: không có hoặc sai token vẫn trả 200 với `isMine = false`; đừng trả 401 ở endpoint này). Lấy tên người đánh giá bằng truy vấn gộp (JOIN `users`), không N+1.

## API đã đăng nhập (khách)

### GET /products/:slug/my-review
- 200: `{ "eligible": true, "reason": null, "review": null }` hoặc có `review: { id, rating, comment, isHidden, createdAt, updatedAt }` nếu đã đánh giá.
- `eligible` (có thể viết đánh giá mới): `true` khi đã nhận hàng sản phẩm này và chưa có đánh giá; ngược lại `false` kèm `reason`: `NOT_PURCHASED` (chưa mua hoặc chưa nhận hàng), `ALREADY_REVIEWED` (đã có đánh giá). Dùng để fe quyết định hiện form.

### POST /products/:slug/reviews
Body `{ rating, comment? }` -> 201 `{ id, rating, comment, isHidden: false, createdAt, updatedAt }`.
- Chưa mua/nhận hàng: 403 `REVIEW_NOT_ALLOWED`. Đã có đánh giá: 409 `REVIEW_ALREADY_EXISTS`. Sai dữ liệu: 400 `VALIDATION_ERROR` (`details[].field`: `rating`, `comment`).
- Một transaction: kiểm tra điều kiện, chèn đánh giá, cập nhật tổng hợp sản phẩm.

### PATCH /reviews/:id
Body `{ rating?, comment? }` (ít nhất một trường) -> 200 đánh giá sau cập nhật. Chỉ chủ đánh giá (đánh giá của người khác: 404). Đang bị ẩn: 403 `REVIEW_HIDDEN`. Cập nhật tổng hợp sản phẩm trong cùng transaction.

### DELETE /reviews/:id
-> 204. Chỉ chủ đánh giá (người khác: 404). Xóa được cả khi đang bị ẩn (chủ muốn gỡ bỏ). Cập nhật tổng hợp sản phẩm trong cùng transaction.

### GET /reviews/me?page&pageSize
Danh sách đánh giá của chính mình (mới nhất trước, `pageSize` mặc định 10, tối đa 50): `{ id, productId, productName, productSlug, rating, comment, isHidden, createdAt, updatedAt }`. Lấy tên sản phẩm bằng truy vấn gộp.

## API quản trị (role admin)

### GET /admin/reviews?page&pageSize&q&rating&hidden&productId
- `q` tìm trong nội dung nhận xét, tên sản phẩm, mã sản phẩm, tên hoặc số điện thoại người đánh giá (khớp một phần, không phân biệt hoa thường); `rating` 1..5; `hidden` = `true` hoặc `false`; `productId`. `pageSize` mặc định 20, tối đa 100. Mới nhất trước.
- Item: `{ id, productId, productName, productCode, productSlug, userId, reviewerName (tên đầy đủ), reviewerPhone, rating, comment, isHidden, createdAt, updatedAt }`. Truy vấn gộp, không N+1.

### PATCH /admin/reviews/:id/visibility
Body `{ isHidden: boolean }` -> 200 item (cùng dạng danh sách). Đổi cờ ẩn rồi cập nhật tổng hợp sản phẩm trong cùng transaction (đặt lại giá trị cũ thì không đổi gì và vẫn trả 200). Không có bản xóa của admin ở giai đoạn này.

## Frontend

### Khách
- Trang chi tiết sản phẩm, mục "Đánh giá khách hàng" (thay phần chỉ hiện điểm trung bình hiện tại):
  - Tóm tắt: điểm trung bình, số lượt, biểu đồ phân bố 5 đến 1 sao (thanh ngang) từ `summary`; chưa có đánh giá thì "Chưa có đánh giá".
  - Lọc theo số sao (tất cả, 5, 4, 3, 2, 1), danh sách đánh giá (sao, tên che bớt, ngày giờ giờ địa phương, nhận xét), phân trang hoặc "Xem thêm", loading skeleton, empty/error state có nút thử lại.
  - Khung viết đánh giá, quyết định bởi `GET /products/:slug/my-review` (chỉ gọi khi đã đăng nhập): `eligible` -> form (chọn 1..5 sao bằng bàn phím và chuột, ô nhận xét có đếm ký tự tối đa 1000, nút gửi có loading, toast kết quả); `NOT_PURCHASED` -> thông báo "Chỉ khách đã mua và nhận hàng mới có thể đánh giá sản phẩm này"; đã có đánh giá -> hiện đánh giá của mình với nút Sửa (form như trên) và Xóa (hộp xác nhận swal), nếu `isHidden` thì hiện nhãn "Đánh giá của bạn đang bị ẩn bởi quản trị viên" và khóa nút Sửa; chưa đăng nhập -> nút đăng nhập kèm `?redirect=` về chính trang sản phẩm.
  - Sau khi tạo/sửa/xóa: cập nhật ngay danh sách, tóm tắt và điểm trên đầu trang (không phải tải lại cả trang).
- `/user/orders/[code]`: với đơn `delivered`, mỗi sản phẩm có nút "Đánh giá" dẫn tới trang chi tiết sản phẩm (cuộn tới mục đánh giá) (cần `productSlug`: nếu hiện chi tiết đơn chưa trả `productSlug` thì dùng `productCode`/liên kết hiện có; không đổi API đơn hàng, báo leader nếu thiếu).
- Trang `/user/reviews` (private): danh sách đánh giá của tôi (từ `GET /reviews/me`), nhãn ẩn, sửa (dẫn tới trang sản phẩm), xóa (swal); empty state. Thêm liên kết "Đánh giá của tôi" vào `/user` và menu tài khoản.
- Thẻ sản phẩm và trang chi tiết đã hiện điểm và số lượt (từ `avgRating`, `reviewCount`) giữ nguyên.

### Admin
- `/admin/reviews`: bảng lọc (ô tìm `useDebounce` 500ms, số sao, trạng thái ẩn/hiện, theo sản phẩm từ URL `?productId=`), phân trang, hiển thị sao, nội dung rút gọn có xem đầy đủ, tên và SĐT người đánh giá, sản phẩm (liên kết sang trang sản phẩm), nút Ẩn/Hiện bằng swal xác nhận; mobile dạng thẻ; bộ lọc đồng bộ lên URL. Bật mục "Đánh giá" trong sidebar admin.

Quy ước giao diện giữ nguyên: toast cho kết quả, `confirmAction` (SweetAlert2) cho xác nhận, token ở `sessionStorage`, trạng thái loading/empty/error, responsive, tiếng Việt, giao diện gọn theo hệ thiết kế hiện có.
