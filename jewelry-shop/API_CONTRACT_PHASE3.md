# API Contract - Giai đoạn 3: Giỏ hàng, Yêu thích, Sổ địa chỉ

Do leader chốt. be, fe, test đều bám theo file này. Muốn đổi thì báo leader, không tự sửa. Quy ước chung (base URL, JWT, blacklist, định dạng lỗi, validate, vai trò) theo `API_CONTRACT.md` bản 2; định dạng danh sách/sản phẩm theo `API_CONTRACT_PHASE2.md`. File này chỉ bổ sung. Schema DB đã có sẵn (`carts`, `cart_items`, `wishlists`, `addresses`, `provinces`, `wards`), KHÔNG cần đổi schema.

- Mọi endpoint dưới đây (trừ `/locations/**`) cần token (user hoặc admin đều dùng được), thiếu/sai token: 401 như hợp đồng chính. Mỗi người chỉ thấy và sửa dữ liệu của chính mình; id của người khác trả 404 `NOT_FOUND` (không lộ sự tồn tại).
- Tiền là số nguyên VND.

## Mã lỗi bổ sung

`ITEM_UNAVAILABLE` (409: biến thể hoặc sản phẩm đã ẩn/ngừng bán), `QUANTITY_LIMIT_EXCEEDED` (400: vượt 10 sản phẩm mỗi dòng giỏ), `ADDRESS_LIMIT_EXCEEDED` (400: tối đa 10 địa chỉ), `INVALID_LOCATION` (400: xã/phường không thuộc tỉnh/thành, kèm `details[].field = "wardId"`). `INSUFFICIENT_STOCK` (409) dùng lại và có thêm hai trường số cùng cấp `code`/`message`: `available` (tồn kho hiện có) và `inCart` (số lượng đang có trong giỏ của biến thể đó).

## Địa giới hành chính (công khai, không cần token)

Dữ liệu sau sáp nhập: 2 cấp, tỉnh/thành -> xã/phường.
- `GET /locations/provinces` -> `[{ id, code, name }]` sắp theo tên.
- `GET /locations/provinces/:provinceId/wards` -> `[{ id, code, name }]` sắp theo tên; 404 nếu tỉnh không tồn tại.
- Cache Redis: key `jewelry:cache:provinces` và `jewelry:cache:wards:<provinceId>`, TTL 86400 giây. Redis lỗi thì vẫn phục vụ từ DB.

## Sổ địa chỉ: `/users/me/addresses`

Địa chỉ trả về: `{ id, receiverName, receiverPhone, provinceId, provinceName, wardId, wardName, detail, isDefault }`.
- `GET` -> danh sách (mặc định lên đầu, sau đó mới tạo trước). Lấy tên tỉnh/xã bằng truy vấn gộp (JOIN hoặc batch `IN`), không N+1.
- `POST` body `{ receiverName (2..100), receiverPhone (SĐT Việt Nam 10 số bắt đầu 0), provinceId, wardId, detail (5..255), isDefault? }` -> 201 địa chỉ.
  - `wardId` phải thuộc `provinceId`, nếu không: 400 `INVALID_LOCATION`. Tỉnh/xã không tồn tại: 400 `INVALID_LOCATION`.
  - Tối đa 10 địa chỉ mỗi tài khoản (400 `ADDRESS_LIMIT_EXCEEDED`). Việc đếm và chèn phải an toàn khi hai request chạy song song (transaction + khóa hàng của user hoặc câu lệnh điều kiện), không để vượt 10.
  - Địa chỉ đầu tiên của tài khoản tự là mặc định. `isDefault: true` thì bỏ cờ mặc định ở các địa chỉ khác, trong cùng một transaction. Luôn có đúng một địa chỉ mặc định khi có ít nhất một địa chỉ.
- `PATCH /:id` các trường tùy chọn như trên, cùng quy tắc kiểm tra. `isDefault: false` trên địa chỉ đang mặc định bị bỏ qua (phải đặt mặc định cho địa chỉ khác để chuyển).
- `PUT /:id/default` -> đặt mặc định (transaction), trả địa chỉ đó.
- `DELETE /:id` -> 204. Xóa địa chỉ mặc định mà còn địa chỉ khác thì địa chỉ tạo gần nhất trở thành mặc định.

## Yêu thích: `/wishlist`

- `GET /wishlist?page&pageSize` -> danh sách phân trang cùng dạng `GET /products` (cùng trường: `price`, `salePrice`, `discountPercent`, `primaryImageUrl`, `inStock`...) kèm `addedAt`, mới thêm lên đầu. Chỉ trả sản phẩm còn `isActive` (sản phẩm ẩn vẫn giữ trong DB nhưng không hiện). Tái sử dụng truy vấn gộp của danh sách sản phẩm, không N+1.
- `GET /wishlist/ids` -> `{ "productIds": [1, 5, 9] }` (tất cả, nhẹ, để fe tô trái tim).
- `POST /wishlist` body `{ productId }` -> 201 `{ productId }`; đã có thì 200 cùng nội dung (idempotent, an toàn khi bấm đúp hay song song: dựa vào khóa unique `(userId, productId)` và bắt duplicate key). Sản phẩm không tồn tại hoặc đã ẩn: 404.
- `DELETE /wishlist/:productId` -> 204 (idempotent, không có cũng 204).

## Giỏ hàng: `/cart`

Quy tắc: giỏ hàng chỉ dành cho người đã đăng nhập. Giá luôn tính theo giá hiện tại (không lưu giá lúc thêm). Mỗi dòng giỏ tối đa 10 sản phẩm. Không giữ chỗ tồn kho trong giỏ (tồn kho chỉ bị trừ khi đặt hàng ở giai đoạn 4).

Giỏ trả về (mọi endpoint ghi đều trả giỏ đầy đủ này):
```json
{
  "items": [{
    "id": 1, "variantId": 10, "productId": 3, "productCode": "DEMO-001",
    "productName": "...", "productSlug": "...", "size": "12", "imageUrl": null,
    "price": 22800000, "salePrice": 19380000, "discountPercent": 15,
    "unitPrice": 19380000, "quantity": 2, "lineTotal": 38760000,
    "stock": 5, "available": true, "issue": null
  }],
  "subtotal": 38760000, "itemCount": 1, "totalQuantity": 2, "hasIssues": false
}
```
- `unitPrice` = `salePrice` nếu có khuyến mại đang hiệu lực, không thì `price` (cùng cách tính của danh sách sản phẩm). `lineTotal = unitPrice * quantity`.
- `issue`: `null` (ổn) | `UNAVAILABLE` (sản phẩm/biến thể đã ẩn) | `OUT_OF_STOCK` (tồn = 0) | `INSUFFICIENT_STOCK` (tồn < số lượng trong giỏ). `available` = `issue` là `null`. `subtotal` chỉ cộng các dòng không có vấn đề (`issue = null`). `hasIssues` = có ít nhất một dòng có vấn đề. `itemCount` = số dòng, `totalQuantity` = tổng số lượng của TẤT CẢ dòng.
- Sắp xếp: dòng thêm gần nhất lên đầu. Lấy thông tin sản phẩm, ảnh đại diện, tồn kho, khuyến mại bằng truy vấn gộp cho cả giỏ, không N+1.

Endpoints:
- `GET /cart` -> giỏ (rỗng thì `items: []`, các tổng bằng 0). GET không được ghi gì vào DB (không tạo giỏ).
- `GET /cart/summary` -> `{ "itemCount": 1, "totalQuantity": 2 }` (nhẹ, cho biểu tượng giỏ trên header).
- `POST /cart/items` body `{ variantId, quantity? (nguyên 1..10, mặc định 1) }` -> 201 và giỏ đầy đủ (các endpoint ghi còn lại trả 200 và giỏ). Thêm mới hoặc cộng dồn nếu biến thể đã có trong giỏ.
  - Biến thể/sản phẩm không tồn tại: 404. Đã ẩn: 409 `ITEM_UNAVAILABLE`. Số lượng sau khi cộng > 10: 400 `QUANTITY_LIMIT_EXCEEDED`. > tồn kho: 409 `INSUFFICIENT_STOCK` (kèm `available`, `inCart`) và KHÔNG thay đổi giỏ.
  - Phải an toàn khi nhiều request song song: tạo giỏ không bị lỗi/trùng khi hai request đầu tiên của một user đến cùng lúc (khóa unique `userId`, bắt duplicate key), và cộng dồn bằng một câu lệnh nguyên tử (`INSERT ... ON DUPLICATE KEY UPDATE`) có kiểm tra ngưỡng, không đọc-sửa-ghi.
- `PATCH /cart/items/:itemId` body `{ quantity (nguyên 1..10) }` -> giỏ. Cùng quy tắc kiểm tra tồn kho/ngưỡng (đặt số lượng tuyệt đối, không cộng dồn). Dòng của người khác hoặc không tồn tại: 404.
- `DELETE /cart/items/:itemId` -> giỏ (không có thì 404).
- `POST /cart/items/remove` body `{ itemIds: number[] (1..50 phần tử) }` -> giỏ. Id không thuộc giỏ của người dùng bị bỏ qua (không lỗi).
- `DELETE /cart` -> 204, xóa toàn bộ dòng trong giỏ.

## Frontend

- Biểu tượng giỏ trên header hiện số lượng từ `GET /cart/summary` khi đã đăng nhập (cập nhật ngay sau khi thêm/xóa/sửa); khách chưa đăng nhập không hiện số, bấm vào đi tới `/cart` rồi bị guard chuyển sang `/login`.
- Chưa đăng nhập mà bấm "Thêm vào giỏ" hoặc trái tim: toast "Vui lòng đăng nhập để tiếp tục" rồi chuyển `/login?redirect=<đường dẫn hiện tại>`. Trang đăng nhập hỗ trợ `?redirect=` (CHỈ chấp nhận đường dẫn nội bộ bắt đầu bằng `/` và không bắt đầu bằng `//`, không chứa `://`; không hợp lệ thì dùng trang theo role như hiện nay); đăng nhập xong quay lại đó. Áp dụng cho cả khi guard chuyển người chưa đăng nhập từ route private.
- Thêm vào giỏ: trang chi tiết bắt chọn size (nếu có nhiều biến thể) và số lượng; thẻ sản phẩm có đúng một biến thể thì thêm thẳng, nhiều biến thể thì đưa sang trang chi tiết để chọn size. Lỗi `INSUFFICIENT_STOCK` hiện toast nêu số còn lại; `QUANTITY_LIMIT_EXCEEDED` và `ITEM_UNAVAILABLE` hiện toast rõ nghĩa.
- Trang `/cart` (private): danh sách dòng (ảnh, tên, mã, size, đơn giá, giá gốc gạch nếu giảm, bộ tăng giảm số lượng 1..min(10, tồn), thành tiền), chọn từng dòng và chọn tất cả, xóa một dòng (hộp xác nhận swal) và xóa các dòng đã chọn (swal), dòng có vấn đề bị làm mờ kèm nhãn rõ (hết hàng, không đủ tồn, ngừng bán) và không chọn được, tổng tiền của các dòng đang chọn, dòng ghi "Phí vận chuyển: tính ở bước thanh toán", nút "Thanh toán" đang vô hiệu hóa hoặc báo "Sắp ra mắt" (đặt hàng làm ở giai đoạn 4), nút "Tiếp tục mua sắm", empty state có nút về `/products`, loading skeleton, error state có nút thử lại. Đổi số lượng không được gây nhấp nháy và không gửi quá nhiều request (gộp/debounce hợp lý, bỏ kết quả cũ nếu có request mới hơn).
- Yêu thích: trái tim trên thẻ sản phẩm và trang chi tiết, trạng thái ban đầu từ `GET /wishlist/ids` (tải một lần khi đăng nhập, giữ trong store, xóa khi đăng xuất), bấm là đổi ngay (optimistic) và hoàn lại nếu API lỗi kèm toast. Trang `/user/wishlist` (private): lưới thẻ có phân trang, bỏ yêu thích, thêm vào giỏ (hoặc sang chi tiết nếu nhiều size), empty state.
- Sổ địa chỉ `/user/addresses` (private): danh sách thẻ địa chỉ có nhãn "Mặc định", thêm/sửa trong modal (họ tên, SĐT, tỉnh/thành, xã/phường, địa chỉ chi tiết, đặt làm mặc định), chọn xã/phường phụ thuộc tỉnh (tải khi đổi tỉnh, có trạng thái loading, ô chọn có tìm theo gõ vì mỗi tỉnh có thể hàng trăm xã/phường), đặt mặc định, xóa (swal), thông báo khi chạm giới hạn 10. Validate phía client khớp hợp đồng, lỗi theo ô.
- Điều hướng: thêm liên kết tới Giỏ hàng, Yêu thích, Sổ địa chỉ trong trang `/user` và menu tài khoản.
- Toast cho kết quả, swal cho xác nhận, token ở `sessionStorage` (như quy ước hiện hành). Không đổi hành vi hiện có của các phần khác.
