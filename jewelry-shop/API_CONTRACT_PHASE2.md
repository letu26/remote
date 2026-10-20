# API Contract - Giai đoạn 2: Danh mục + Sản phẩm

Do leader chốt. be, fe, test đều bám theo file này. Muốn đổi thì báo leader, không tự sửa. Mọi quy ước chung (base URL, JWT, định dạng lỗi, validate, blacklist, vai trò) giữ như `API_CONTRACT.md` (bản 2). File này chỉ bổ sung.

- Tiền tệ: số nguyên VND (không có phần thập phân). Trọng lượng gam (tối đa 3 chữ số thập phân). Thời gian ISO 8601.
- Phân trang: `page` (từ 1, mặc định 1), `pageSize` (mặc định 12, tối đa 48 cho khách, 100 cho admin). Response danh sách: `{ "items": [...], "page": 1, "pageSize": 12, "total": 0, "totalPages": 0 }`.
- Tất cả endpoint `/admin/**` cần token role `admin` (401/403 như hợp đồng chính).
- Slug: tự sinh từ tên (bỏ dấu tiếng Việt, chữ thường, nối bằng `-`, thêm hậu tố `-2`, `-3` nếu trùng). Nếu client gửi `slug` thì dùng nó, trùng thì 409 `SLUG_ALREADY_EXISTS`. Slug chỉ gồm `a-z 0-9 -`.

## Bổ sung chốt sau (ưu tiên hơn nội dung cũ nếu mâu thuẫn)

- Lỗi trùng khóa `PRODUCT_CODE_ALREADY_EXISTS`, `SKU_ALREADY_EXISTS`, `SLUG_ALREADY_EXISTS`, `NAME_ALREADY_EXISTS` PHẢI kèm `details` để fe gắn đúng ô: `details: [{ "field": "code" | "slug" | "name" | "variants[<chỉ số trong mảng gửi lên>].sku", "message": "..." }]`. Với SKU, `<chỉ số>` là vị trí của biến thể trùng trong mảng `variants` của request (0, 1, 2...).
- `PATCH` sản phẩm/danh mục/bộ sưu tập: nếu `code`/`slug`/`name` gửi lên bằng đúng giá trị hiện tại của chính bản ghi đó thì KHÔNG phải lỗi trùng (chỉ báo trùng khi trùng với bản ghi khác).
- `GET /admin/collections` trả thêm `productCount` (như chất liệu, loại đá).
- Tên sản phẩm `name` dài 2..200 ký tự (khớp cột DB).
- Biến thể đã lưu không bị xóa qua PATCH, chỉ bị ẩn (`isActive=false`) khi không còn trong danh sách (đã nêu ở phần PATCH sản phẩm).

## Bổ sung giai đoạn 3 cho item sản phẩm

Mỗi item trong `GET /products`, `related` của `GET /products/:slug` và `GET /wishlist` có thêm hai trường: `variantCount` (số biến thể `isActive` của sản phẩm) và `singleVariantId` (id của biến thể đó nếu `variantCount = 1`, ngược lại `null`). Tính bằng truy vấn gộp cho cả trang, không N+1. Dùng để thẻ sản phẩm thêm thẳng vào giỏ khi chỉ có một biến thể mà không phải gọi thêm API.

## Mã lỗi bổ sung

`SLUG_ALREADY_EXISTS` (409), `PRODUCT_CODE_ALREADY_EXISTS` (409), `SKU_ALREADY_EXISTS` (409), `NAME_ALREADY_EXISTS` (409, trùng tên chất liệu/loại đá), `RESOURCE_IN_USE` (409, đang được dùng nên không xóa được; message nói rõ dùng ở đâu và gợi ý ẩn thay vì xóa), `INSUFFICIENT_STOCK` (409), `INVALID_IMAGE` (400, sai định dạng/dung lượng/nội dung không phải ảnh), `IMAGE_LIMIT_EXCEEDED` (400), `UPLOAD_NOT_CONFIGURED` (503, chưa cấu hình Cloudinary), `UPLOAD_FAILED` (502), `NOT_FOUND` (404 cho id/slug không tồn tại).

## API công khai (không cần token)

### GET /categories
Cây danh mục đang hiển thị (`isActive=true`), sắp theo `sortOrder` rồi `name`:
`[{ id, name, slug, parentId, sortOrder, children: [ ...cùng dạng ] }]`. Danh mục ẩn kéo theo con của nó cũng ẩn.

### GET /materials, GET /gemstones
`[{ id, name }]` đang hiển thị, sắp theo tên. Dùng cho bộ lọc.

### GET /collections
`[{ id, name, slug, description, bannerUrl }]` đang hiển thị.

### GET /products
Query (tất cả tùy chọn): `page`, `pageSize`, `q` (tìm trong tên và mã sản phẩm, không phân biệt hoa thường/dấu thì tốt nhưng tối thiểu không phân biệt hoa thường), `category` (slug; gồm cả sản phẩm của danh mục con), `collection` (slug), `material` (id), `gemstone` (id, nhiều giá trị cách nhau dấu phẩy), `targetGroup` (`men|women|unisex|kids`), `minPrice`, `maxPrice`, `inStock=true`, `onSale=true`, `featured=true`, `sort`.
- `targetGroup`: `women` trả sản phẩm `women` + `unisex`; `men` trả `men` + `unisex`; `kids` chỉ `kids`; `unisex` chỉ `unisex`.
- `sort`: `newest` (mặc định, `createdAt` giảm dần), `price_asc`, `price_desc`, `bestseller` (`soldCount` giảm dần), `rating` (`avgRating` giảm dần rồi `reviewCount`). Luôn thêm `id` làm khóa phụ để phân trang ổn định.
- Chỉ trả sản phẩm `isActive=true` thuộc danh mục đang hiển thị.
- `inStock`: có ít nhất một biến thể `isActive` với `stock > 0`.
- `onSale`: có khuyến mại `isActive` đang hiệu lực (`startsAt <= now <= endsAt`) trong bảng `promotions`. Giai đoạn 2 chưa có API quản lý khuyến mại nên danh sách này có thể rỗng, đó là đúng.
- Giá bán hiển thị: nếu có khuyến mại hiệu lực thì `salePrice = round(price * (100 - discountPercent) / 100)` với `discountPercent` là mức giảm CAO NHẤT trong các khuyến mại hiệu lực; ngược lại `salePrice` và `discountPercent` là `null`. Lọc/sắp xếp theo giá dùng giá sau khuyến mại (`salePrice` nếu có, không thì `price`).
Mỗi item: `{ id, code, name, slug, price, salePrice, discountPercent, primaryImageUrl, inStock, avgRating, reviewCount, isFeatured, targetGroup, category: { id, name, slug } }`. `primaryImageUrl` là `null` nếu chưa có ảnh (fe hiện ảnh minh họa mặc định).
Không N+1: lấy ảnh đại diện, tồn kho, khuyến mại, danh mục bằng truy vấn gộp/batch cho cả trang.

### GET /products/:slug
404 `NOT_FOUND` nếu không có hoặc sản phẩm ẩn. Trả:
```json
{
  "id": 1, "code": "LG-001", "name": "...", "slug": "...", "description": "...",
  "price": 0, "salePrice": null, "discountPercent": null,
  "targetGroup": "women", "weight": 3.2, "warrantyInfo": "...", "certificate": "...",
  "isFeatured": false, "avgRating": 0, "reviewCount": 0, "soldCount": 0, "inStock": true,
  "category": { "id": 1, "name": "...", "slug": "..." },
  "breadcrumb": [{ "id": 1, "name": "...", "slug": "..." }],
  "material": { "id": 1, "name": "..." },
  "collection": { "id": 1, "name": "...", "slug": "..." },
  "images": [{ "id": 1, "url": "...", "isPrimary": true, "sortOrder": 0 }],
  "variants": [{ "id": 1, "sku": "...", "size": "12", "stock": 5 }],
  "gemstones": [{ "id": 1, "gemstoneId": 1, "name": "Kim cương", "quantity": 1, "carat": 0.5, "color": "D", "clarity": "VS1", "cut": "Excellent" }],
  "related": [ ...tối đa 8 item cùng dạng item của danh sách, cùng danh mục, loại trừ chính nó ]
}
```
`material`, `collection` có thể `null`. Chỉ trả biến thể `isActive`. Không trả `costPrice`. `breadcrumb` từ danh mục gốc tới danh mục của sản phẩm.

## API quản trị (`/admin/**`, role admin)

### Danh mục: `/admin/categories`
- `GET /admin/categories`: danh sách phẳng gồm cả mục ẩn: `[{ id, name, slug, parentId, sortOrder, isActive, productCount, childCount }]`.
- `POST`: `{ name, slug?, parentId?, sortOrder?, isActive? }` -> 201 danh mục. `name` 2..100 ký tự. `parentId` phải tồn tại.
- `PATCH /:id`: các trường tùy chọn như trên. Không cho `parentId` là chính nó hoặc hậu duệ của nó (tránh vòng): 400 `VALIDATION_ERROR`.
- `DELETE /:id`: 204. Có danh mục con hoặc có sản phẩm thì 409 `RESOURCE_IN_USE` (gợi ý ẩn bằng `isActive=false`).

### Chất liệu: `/admin/materials`, Loại đá: `/admin/gemstones`
- `GET` (cả mục ẩn, kèm `productCount`), `POST { name, isActive? }`, `PATCH /:id`, `DELETE /:id`. Tên duy nhất (409 `NAME_ALREADY_EXISTS`). Xóa khi đang được sản phẩm dùng: 409 `RESOURCE_IN_USE`.

### Bộ sưu tập: `/admin/collections`
- `GET`, `POST { name, slug?, description?, bannerUrl?, isActive? }`, `PATCH /:id`, `DELETE /:id` (đang có sản phẩm: 409 `RESOURCE_IN_USE`). Banner ở giai đoạn này chỉ nhận URL chuỗi (upload banner để giai đoạn sau).

### Sản phẩm: `/admin/products`
- `GET /admin/products`: query `page, pageSize, q, categoryId, isActive`. Mỗi item: `{ id, code, name, slug, price, categoryId, categoryName, isActive, isFeatured, totalStock, primaryImageUrl, createdAt }`.
- `GET /admin/products/:id`: đầy đủ gồm `costPrice`, tất cả ảnh, TẤT CẢ biến thể (kể cả đã ẩn), đá quý.
- `POST /admin/products` -> 201 sản phẩm đầy đủ (như GET :id). Body:
```json
{
  "code": "LG-001", "name": "...", "slug": "?", "description": "?",
  "categoryId": 1, "materialId": null, "collectionId": null,
  "targetGroup": "unisex", "weight": 3.2,
  "costPrice": 0, "price": 1000000,
  "warrantyInfo": "?", "certificate": "?",
  "isFeatured": false, "isActive": true,
  "gemstones": [{ "gemstoneId": 1, "quantity": 1, "carat": 0.5, "color": "D", "clarity": "VS1", "cut": "Excellent" }],
  "variants": [{ "sku": "LG-001-12", "size": "12", "stock": 5, "isActive": true }]
}
```
  - `code` 2..50 ký tự duy nhất (409 `PRODUCT_CODE_ALREADY_EXISTS`). `price` > 0, `costPrice` >= 0, nguyên. `categoryId` phải tồn tại, `materialId`/`collectionId` nếu có phải tồn tại.
  - Ít nhất 1 biến thể. Sản phẩm không có size dùng một biến thể có `size: ""`. `sku` duy nhất toàn hệ thống (409 `SKU_ALREADY_EXISTS`), `size` không trùng trong cùng sản phẩm. `stock` nguyên >= 0.
  - Tạo sản phẩm + biến thể + đá quý trong MỘT transaction. Trùng khóa (code/sku/slug) bắt bằng lỗi duplicate key của DB (không chỉ check trước) để chống race.
- `PATCH /admin/products/:id`: các trường tùy chọn như POST.
  - `gemstones` có mặt thì THAY THẾ toàn bộ danh sách đá quý.
  - `variants` có mặt thì đồng bộ: phần tử có `id` thì cập nhật (`sku`, `size`, `isActive`; KHÔNG ghi đè `stock` ở đây), không có `id` thì tạo mới, biến thể hiện có nhưng không xuất hiện trong danh sách thì chuyển `isActive=false` (không xóa vì đơn hàng có thể tham chiếu). Tồn kho đổi bằng endpoint riêng bên dưới (để tránh ghi đè sai khi đang có đơn).
  - Toàn bộ trong một transaction.
- `PATCH /admin/products/:id/variants/:variantId/stock`: body `{ "delta": -2 }` hoặc `{ "set": 10 }` (đúng một trong hai). Thực hiện bằng một câu `UPDATE` nguyên tử (`stock = stock + ?` với điều kiện kết quả >= 0; hoặc `SET stock = ?`), không đọc-sửa-ghi. Không đủ tồn: 409 `INSUFFICIENT_STOCK`. Trả `{ id, sku, size, stock }`.
- `DELETE /admin/products/:id`: 204. Nếu bất kỳ biến thể nào đã có trong `order_items` thì 409 `RESOURCE_IN_USE` (gợi ý ẩn sản phẩm bằng `isActive=false`). Nếu xóa được: xóa luôn ảnh (ảnh trên Cloudinary xóa bất đồng bộ, lỗi chỉ ghi log), biến thể, đá quý, khuyến mại, mục yêu thích, mục giỏ hàng, đánh giá; trong transaction.

### Ảnh sản phẩm (Cloudinary): `/admin/products/:id/images`
- `POST` (multipart/form-data, field `files`, tối đa 8 file mỗi lần, tối đa 10 ảnh mỗi sản phẩm): jpg, png, webp, tối đa 5MB mỗi file. Kiểm tra cả loại MIME và chữ ký (magic bytes) của file, KHÔNG tin tên file/phần mở rộng. Sai: 400 `INVALID_IMAGE`; vượt số lượng: 400 `IMAGE_LIMIT_EXCEEDED`.
  - Upload lên Cloudinary từ server (SDK chính thức `cloudinary`), thư mục `${CLOUDINARY_FOLDER}/products/<productId>`, lưu `url` (`secure_url`) và `publicId` vào `product_images`. Ảnh đầu tiên của sản phẩm tự thành ảnh đại diện nếu chưa có ảnh đại diện.
  - 201: `[{ id, url, isPrimary, sortOrder }]`. Nếu `CLOUDINARY_URL` trống: 503 `UPLOAD_NOT_CONFIGURED`. Lỗi Cloudinary: 502 `UPLOAD_FAILED` (không để lại dòng DB mồ côi: nếu ghi DB lỗi thì xóa ảnh vừa tải lên).
  - Đặt lớp lưu trữ sau một interface (`ImageStorage`) để đổi nhà cung cấp sau này mà không sửa service nghiệp vụ.
- `PATCH /:imageId`: `{ isPrimary?, sortOrder? }`. Đặt `isPrimary=true` thì bỏ cờ ở ảnh khác (luôn đúng một ảnh đại diện nếu có ảnh), trong transaction.
- `PUT /order`: `{ "imageIds": [3,1,2] }` sắp lại `sortOrder` theo thứ tự này (phải đúng tập ảnh của sản phẩm).
- `DELETE /:imageId`: 204. Xóa dòng DB rồi xóa trên Cloudinary bất đồng bộ (lỗi chỉ ghi log). Nếu xóa ảnh đại diện thì ảnh còn lại đầu tiên (theo `sortOrder`) thành ảnh đại diện.

## Cache

Có thể cache cây danh mục và danh sách bộ lọc (`/categories`, `/materials`, `/gemstones`, `/collections`) trong Redis, key `jewelry:cache:<tên>`, TTL 300 giây, xóa key khi admin ghi dữ liệu liên quan. Không cache danh sách sản phẩm trong giai đoạn này.

## Dữ liệu mẫu

Script `npm run seed:catalog` (trong `be`) nạp dữ liệu mẫu bằng cách chèn trực tiếp vào DB (đọc `.env`, SSL như `seed-locations.mjs`): danh mục (Nhẫn, Dây chuyền, Bông tai, Lắc và vòng tay), chất liệu (Vàng 10K/14K/18K/24K, Vàng trắng, Vàng hồng, Bạc, Bạch kim), loại đá (Kim cương, Ruby, Sapphire, Ngọc trai, Emerald), vài bộ sưu tập, và khoảng 14 sản phẩm lấy từ `fe/src/constants/sample-products.ts` (mã bắt đầu bằng `DEMO-`, không có ảnh, có biến thể/size và tồn kho, vài sản phẩm có đá quý). Chạy lại nhiều lần không trùng dữ liệu (upsert theo `code`/`slug`/`name`). Cờ `--remove` xóa đúng dữ liệu mẫu (sản phẩm mã `DEMO-%` và danh mục/chất liệu/đá/bộ sưu tập do script tạo nếu không còn sản phẩm khác dùng).

## Frontend

- Khách: `/products` và `/products/[slug]`, trang chủ, menu danh mục lấy từ API thật (bỏ dữ liệu mẫu cục bộ). Bộ lọc và sắp xếp nằm trên URL như hiện tại, gửi xuống query của `GET /products`. Sản phẩm không có ảnh hiện ảnh minh họa mặc định. Ảnh Cloudinary hiển thị qua `next/image` (cấu hình `images.remotePatterns` cho `res.cloudinary.com`).
- Admin: các trang `/admin/categories`, `/admin/materials`, `/admin/gemstones`, `/admin/collections`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`. Chỉ role admin truy cập (guard như hiện có). Xác nhận trước khi xóa; lỗi 409 `RESOURCE_IN_USE` hiện thông báo rõ và gợi ý ẩn; tải ảnh có tiến trình và xử lý `UPLOAD_NOT_CONFIGURED` bằng thông báo thân thiện.
