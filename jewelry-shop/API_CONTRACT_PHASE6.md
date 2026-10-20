# API Contract - Giai đoạn 6: Nội dung (CMS) và Chatbot

Do leader chốt. be, fe, test đều bám theo file này. Muốn đổi thì báo leader, không tự sửa. Quy ước chung theo `API_CONTRACT.md` bản 2 (định dạng lỗi, JWT, validate), `API_CONTRACT_PHASE2.md` (phân trang, slug, ảnh Cloudinary). File này chỉ bổ sung.

Schema: các bảng `banners`, `menus`, `articles`, `pages`, `faqs`, `site_settings` đã có. Đã thêm bằng `be/database/changes/007_cms_columns.sql` (đã áp vào DB, entity cần thêm cột): `banners.imagePublicId`, `articles.thumbnailPublicId`, `menus.placement` (`header` | `footer`, mặc định `header`), cùng hai chỉ mục. Không đổi schema nào khác; cần đổi thì báo leader. `site_settings` có cột khóa tên `setting_key` (thuộc tính entity `key`) và `value`.

- `/admin/**` cần role admin. Endpoint công khai không cần token.
- Nội dung bài viết và trang là **Markdown thuần** (lưu nguyên văn trong cột `content`). Server KHÔNG render, KHÔNG nhận HTML như một định dạng (fe hiển thị Markdown không cho phép HTML thô). Chỉ cắt ký tự NUL, giới hạn độ dài.
- Liên kết (`linkUrl` của banner, `url` của menu) chỉ chấp nhận: đường dẫn nội bộ bắt đầu bằng `/` và KHÔNG bắt đầu bằng `//`, hoặc URL `http://`/`https://`. Từ chối mọi scheme khác (`javascript:`, `data:`...) và ký tự điều khiển: 400 `VALIDATION_ERROR` (`details[].field` là tên trường).
- Mọi thời gian trả client là ISO có hậu tố Z.

## Mã lỗi bổ sung

`RESERVED_PAGE` (409: trang hệ thống không xóa được hoặc không đổi slug), `RATE_LIMITED` (429: chatbot hỏi quá nhiều, kèm `retryAfterSeconds`). Dùng lại: `SLUG_ALREADY_EXISTS`, `RESOURCE_IN_USE`, `INVALID_IMAGE`, `UPLOAD_NOT_CONFIGURED`, `UPLOAD_FAILED`, `NOT_FOUND`, `VALIDATION_ERROR`.

## Thông tin cửa hàng (site-info)

Lưu trong `site_settings` với khóa `site.<tên>`; thiếu khóa thì dùng giá trị mặc định ở server (mặc định đặt trong code, được nạp thật bằng script seed, đều là MẪU để admin sửa).

| Trường | Khóa | Giới hạn | Mặc định |
|---|---|---|---|
| `brandName` | `site.brandName` | 1..60 | `Lumière Gems` |
| `slogan` | `site.slogan` | 0..150 | `Trang sức đá quý tinh tế` |
| `hotline` | `site.hotline` | 0..30 | `1900 0000` |
| `email` | `site.email` | email hợp lệ hoặc rỗng, tối đa 150 | `lienhe@example.com` |
| `address` | `site.address` | 0..255 | `Số 1, Phố Mẫu, Hà Nội` |
| `openingHours` | `site.openingHours` | 0..100 | `08:30 - 21:00 mỗi ngày` |
| `facebook`, `zalo`, `instagram`, `tiktok` | `site.facebook`... | rỗng hoặc URL `https://`, tối đa 255 | rỗng |
| `footerText` | `site.footerText` | 0..300 | rỗng |

- `GET /site-info` (công khai) -> object đủ các trường trên (chuỗi, rỗng nếu chưa có). Cache Redis `jewelry:cache:site-info` TTL 300 giây, xóa khi admin lưu; Redis lỗi thì vẫn phục vụ từ DB.
- `GET /admin/settings/site-info` -> như trên. `PUT /admin/settings/site-info` body là object đủ các trường (kiểm tra theo bảng, chỉ nhận đúng các khóa này, khóa lạ bị bỏ qua) -> 200 object đã lưu.
- Trang cài đặt hiện có (`/admin/settings`, đang là thông tin chuyển khoản) thêm phần "Thông tin cửa hàng". Hóa đơn in dùng `hotline`, `address`, `email` từ đây.

## Tải ảnh dùng chung (admin)

`POST /admin/media/images` (multipart/form-data, field `file`, MỘT file): jpg/png/webp, tối đa 5MB, kiểm tra chữ ký file (magic bytes) như ảnh sản phẩm. Lưu Cloudinary thư mục `${CLOUDINARY_FOLDER}/cms` -> 201 `{ url, publicId }`. Lỗi như ảnh sản phẩm (`INVALID_IMAGE` 400, `UPLOAD_NOT_CONFIGURED` 503, `UPLOAD_FAILED` 502). Dùng lại `ImageStorage` hiện có. Ảnh tải lên chưa gắn vào bản ghi nào sẽ mồ côi trên Cloudinary (chấp nhận ở giai đoạn này; fe hạn chế tải thừa).
Khi banner/bài viết đổi hoặc xóa ảnh (có `imagePublicId`/`thumbnailPublicId`), server xóa ảnh cũ trên Cloudinary bất đồng bộ sau khi ghi DB thành công (lỗi chỉ ghi log).

## Banner

Vị trí (`position`): `home_hero` (băng chuyền đầu trang chủ), `home_promo` (các ô quảng cáo nhỏ trên trang chủ).
- `GET /banners?position=home_hero` (công khai) -> `[{ id, title, imageUrl, linkUrl, position, sortOrder }]` chỉ `isActive`, sắp theo `sortOrder` rồi `id`. Thiếu `position` thì trả tất cả vị trí.
- Admin `/admin/banners`: `GET` (tất cả, kể cả ẩn, có `imagePublicId`, `isActive`, `createdAt`), `POST { title (1..150), imageUrl (https, tối đa 500), imagePublicId?, linkUrl?, position, sortOrder? (nguyên), isActive? }` -> 201, `PATCH /:id` (các trường tùy chọn; đổi ảnh thì xóa ảnh cũ), `DELETE /:id` -> 204 (xóa ảnh trên Cloudinary nếu có `imagePublicId`). `imageUrl` bắt buộc là `https://`.

## Menu

Vị trí (`placement`): `header` (thanh điều hướng đầu trang), `footer` (liên kết chân trang). Tối đa 2 cấp (mục gốc và mục con).
- `GET /menus?placement=header` (công khai, mặc định `header`) -> cây `[{ id, label, url, children: [{ id, label, url }] }]` chỉ mục `isActive` (mục gốc ẩn thì con của nó cũng ẩn), sắp theo `sortOrder` rồi `id`. Cache Redis `jewelry:cache:menus:<placement>` TTL 300 giây, xóa khi admin ghi.
- Admin `/admin/menus`: `GET` (phẳng, cả mục ẩn, kèm `placement`, `parentId`, `sortOrder`, `isActive`), `POST { label (1..100), url, parentId?, placement? (mặc định header), sortOrder?, isActive? }` -> 201. `parentId` phải tồn tại, là mục gốc (không có cha) và cùng `placement`, nếu không: 400 (`details[].field = parentId`). `PATCH /:id`: không cho một mục thành con của chính nó hoặc của con nó; mục đang có con không được gán cha (vượt 2 cấp): 400; đổi `placement` của mục gốc thì áp dụng cho cả con trong cùng transaction. `DELETE /:id` -> 204; mục có con: 409 `RESOURCE_IN_USE` (xóa con trước).

## Bài viết (tư vấn trang sức)

- `GET /articles?page&pageSize&q` (công khai): chỉ bài `isPublished = 1` và `publishedAt <= now`, mới đăng trước. `pageSize` mặc định 9, tối đa 24. `q` tìm trong tiêu đề và tóm tắt (khớp một phần, không phân biệt hoa thường). Item `{ id, title, slug, summary, thumbnailUrl, publishedAt }` (không có `content`). Dạng phân trang như danh sách sản phẩm (`items, page, pageSize, total, totalPages`).
- `GET /articles/:slug` (công khai): `{ id, title, slug, summary, content, thumbnailUrl, publishedAt, updatedAt, related: [item tối đa 3 bài mới khác] }`. Bài chưa đăng hoặc không tồn tại: 404.
- Admin `/admin/articles`: `GET ?page&pageSize&q&published` (mọi bài, item thêm `isPublished`, `createdAt`, `updatedAt`), `GET /:id` (đầy đủ, có `thumbnailPublicId`), `POST { title (3..255), slug?, summary? (0..500), content (1..100000, Markdown), thumbnailUrl? (https, tối đa 500), thumbnailPublicId?, isPublished? }` -> 201: `authorId` = id admin, slug tự sinh từ tiêu đề như sản phẩm (trùng: 409 `SLUG_ALREADY_EXISTS` kèm `details[].field = slug` nếu client tự gửi slug; tự sinh thì thêm hậu tố), `publishedAt` = now khi bài được đăng lần đầu. `PATCH /:id` (các trường tùy chọn; chuyển từ nháp sang đăng mà `publishedAt` còn null thì đặt now; gỡ đăng giữ nguyên `publishedAt` nhưng bài bị ẩn; đổi ảnh thì xóa ảnh cũ). Bỏ ảnh đại diện: `thumbnailUrl: null` hoặc chuỗi rỗng `""` đều là "bỏ ảnh": server đặt `thumbnailUrl` và `thumbnailPublicId` về null và xóa ảnh cũ trên Cloudinary (bất đồng bộ). Ở `POST`, `thumbnailUrl` null/rỗng nghĩa là không có ảnh. Banner luôn bắt buộc có ảnh (không bỏ ảnh được, chỉ thay ảnh). `DELETE /:id` -> 204 (xóa cả ảnh trên Cloudinary).

## Trang nội dung (giới thiệu, chính sách...)

Trang hệ thống (slug dành riêng, không xóa, không đổi slug): `ve-chung-toi` (Giới thiệu), `chinh-sach-bao-hanh`, `chinh-sach-doi-tra`, `chinh-sach-giao-hang`, `dieu-khoan-su-dung`, `huong-dan-do-size`.
- `GET /pages` (công khai) -> `[{ slug, title }]` các trang `isActive`, sắp theo `title`. `GET /pages/:slug` (công khai) -> `{ slug, title, content, updatedAt }`; ẩn hoặc không tồn tại: 404.
- Admin `/admin/pages`: `GET` (tất cả, có `id`, `isActive`, `isReserved`), `GET /:id`, `POST { slug (a-z, 0-9, dấu gạch ngang, 2..120, duy nhất: 409 `SLUG_ALREADY_EXISTS`), title (1..255), content (1..100000), isActive? }` -> 201, `PATCH /:id` (đổi `slug` của trang hệ thống: 409 `RESERVED_PAGE`), `DELETE /:id` -> 204 (trang hệ thống: 409 `RESERVED_PAGE`).

## Câu hỏi thường gặp (FAQ) và Chatbot

- `GET /faqs` (công khai) -> `[{ id, question, answer }]` chỉ `isActive`, sắp theo `sortOrder` rồi `id`.
- Admin `/admin/faqs`: `GET` (tất cả, kèm `keywords`, `sortOrder`, `isActive`), `POST { question (3..500), answer (1..2000), keywords? (chuỗi, các từ khóa/cụm từ cách nhau dấu phẩy, mỗi cái 2..50 ký tự, tối đa 20 cái, tổng tối đa 1000 ký tự), sortOrder?, isActive? }` -> 201, `PATCH /:id`, `DELETE /:id` -> 204.

### Chatbot theo từ khóa (không dùng AI)
- `GET /chatbot/suggestions` (công khai) -> `{ greeting, suggestions: [{ id, question }] }`: lời chào cố định và tối đa 4 câu hỏi FAQ đầu tiên theo `sortOrder`.
- `POST /chatbot/ask` (công khai) body `{ message }` (cắt khoảng trắng, 1..300 ký tự) -> 200 `{ answer, matched: { id, question } | null, suggestions: [{ id, question }], fallback: boolean }`.
- Thuật toán (xác định, có test đơn vị): chuẩn hóa (chữ thường, bỏ dấu tiếng Việt, `đ` thành `d`, bỏ dấu câu, gộp khoảng trắng) cho cả tin nhắn, từ khóa và câu hỏi. Điểm của mỗi FAQ `isActive` = 3 điểm cho mỗi từ khóa/cụm từ khóa (đã chuẩn hóa) xuất hiện trong tin nhắn (khớp theo ranh giới từ) + 1 điểm cho mỗi từ khác biệt (độ dài >= 3, không nằm trong danh sách từ dừng nhỏ như `la`, `co`, `khong`, `the`, `nao`, `cho`, `toi`, `minh`, `ban`, `shop`) của câu hỏi FAQ xuất hiện trong tin nhắn. Chọn FAQ điểm cao nhất, hòa thì `sortOrder` nhỏ hơn rồi `id` nhỏ hơn; yêu cầu điểm >= 3, nếu không là `fallback`.
- `fallback = true`: `answer` là lời xin lỗi nêu hotline/email lấy từ site-info (ví dụ "Xin lỗi, mình chưa tìm thấy câu trả lời phù hợp. Bạn vui lòng gọi hotline {hotline} hoặc email {email} để được hỗ trợ."), `matched = null`. Khớp: `answer` là câu trả lời của FAQ. `suggestions` luôn có tối đa 4 FAQ khác (ưu tiên theo điểm giảm dần khi không khớp, theo `sortOrder` khi khớp), không trùng `matched`.
- Giới hạn tốc độ: 20 request mỗi phút mỗi địa chỉ IP (tối đa 20 mỗi phút cho `ask`), bằng Redis (`INCR` + `EXPIRE` nguyên tử hoặc Lua), vượt: 429 `RATE_LIMITED` kèm `retryAfterSeconds`. Redis lỗi thì không chặn (ghi log). Nội dung tin nhắn KHÔNG ghi vào log.

## Dữ liệu mẫu

Script `npm run seed:cms` (trong `be`, idempotent, `--remove` gỡ phần mẫu, `timezone: 'Z'` như các script khác): 6 trang hệ thống với nội dung MẪU (ghi rõ "Nội dung mẫu, cửa hàng cần thay bằng nội dung thật" ở đầu mỗi trang, chính sách ngắn gọn nhưng hợp lý bằng tiếng Việt), menu header mặc định (Trang chủ `/`, Trang sức `/products` với con Nhẫn/Dây chuyền/Bông tai/Lắc và vòng tay trỏ `/products?category=<slug>` theo đúng slug danh mục đang có trong DB, Đá quý `/products?category=da-quy` nếu có danh mục đó, Bộ sưu tập `/products` hoặc đường dẫn bộ sưu tập hiện có của fe, Khuyến mại `/products?onSale=true`, Cẩm nang `/articles`), menu footer (các trang chính sách, Hỏi đáp `/faq`, Cẩm nang `/articles`), 10 FAQ có từ khóa (giờ mở cửa, bảo hành, đổi trả, giao hàng/phí, thanh toán/chuyển khoản, đo size nhẫn, bảo quản trang sức, giấy kiểm định, khuyến mại, liên hệ), 3 bài viết mẫu có slug bắt đầu bằng `demo-` (chọn nhẫn cầu hôn, bảo quản trang sức, phân biệt kim cương và moissanite; nội dung do bạn tự viết, ngắn, chính xác, không sao chép từ nguồn nào), đã đăng, và nạp các giá trị `site.*` mặc định CHỈ khi khóa chưa có (không đè giá trị admin đã sửa). Không nạp banner (chưa có ảnh). Cờ `--remove` chỉ xóa các bản ghi mẫu do script tạo (bài `demo-%`; trang/menu/FAQ mẫu chỉ xóa nếu chưa bị admin sửa, hoặc nếu khó xác định thì chỉ xóa bài `demo-%` và FAQ/menu có dấu hiệu mẫu, nêu rõ cách nhận diện trong báo cáo).
Ngoài ra sửa `scripts/seed-catalog.mjs` để sản phẩm DEMO được nạp với `avgRating = 0`, `reviewCount = 0` và KHÔNG ghi đè hai trường này khi chạy lại (điểm đánh giá thuộc về dữ liệu đánh giá thật).

## Frontend

### Khách (đã có sẵn component `src/components/common/MarkdownContent.tsx` hiển thị Markdown an toàn, dùng lại, không tự viết bộ render khác)
- **Trang chủ:** băng chuyền banner `home_hero` từ API (tự chạy chậm, nút trước/sau và chấm chuyển, tạm dừng khi rê chuột/focus, dừng hẳn khi hệ điều hành bật giảm chuyển động, dùng được bằng bàn phím, ảnh `next/image` hoặc `<img>` có `alt` = `title`, kích thước giữ chỗ để không nhảy bố cục); không có banner thì giữ hero tĩnh hiện tại. Banner `home_promo` hiện dạng lưới ô nhỏ nếu có. Khối "Cẩm nang trang sức" lấy 3 bài mới từ `GET /articles` (ẩn nếu rỗng). Một khối lỗi không làm hỏng cả trang.
- **Điều hướng và chân trang:** thanh điều hướng đầu trang lấy từ `GET /menus?placement=header` (có menu con dạng dropdown/accordion trên mobile, đóng được bằng Esc, dùng được bằng bàn phím); chân trang lấy `GET /menus?placement=footer` và `GET /site-info` (tên thương hiệu, khẩu hiệu, hotline có liên kết `tel:`, email có `mailto:`, địa chỉ, giờ mở cửa, mạng xã hội chỉ hiện cái có giá trị, `footerText`). Có phương án dự phòng bằng hằng số hiện có khi API lỗi hoặc rỗng (không làm trống header/footer). Tên thương hiệu hiển thị lấy từ `site-info` (dự phòng hằng số `BRAND_NAME`). Tải một lần và dùng chung (không gọi lại mỗi lần chuyển trang).
- **Trang `/articles`** (danh sách có tìm kiếm debounce 500ms, lưới thẻ, phân trang), **`/articles/[slug]`** (tiêu đề, ngày đăng, ảnh, nội dung Markdown, bài liên quan, 404 khi không có), **`/pages/[slug]`** (nội dung Markdown, 404 khi không có), **`/faq`** (accordion câu hỏi thường gặp, dùng được bằng bàn phím và trình đọc màn hình).
- **Chatbot:** nút nổi mở khung chat (đóng được bằng Esc, không che nội dung quan trọng trên mobile): lời chào và các câu hỏi gợi ý dạng nút bấm từ `GET /chatbot/suggestions`; ô nhập tối đa 300 ký tự, gửi bằng Enter, `POST /chatbot/ask`, hiển thị câu trả lời (văn bản thuần, giữ xuống dòng), chỉ báo "đang trả lời", câu hỏi gợi ý đi kèm câu trả lời, lỗi mạng có thông báo, `RATE_LIMITED` hiện toast nêu số giây phải chờ. Lịch sử hội thoại giữ trong `sessionStorage` (xóa khi đóng tab), có nút xóa hội thoại. `aria-live` cho tin nhắn mới.
- **Điều khoản:** ô đồng ý điều khoản ở `/register` có liên kết tới `/pages/dieu-khoan-su-dung` (mở tab mới). Trang chi tiết sản phẩm: mục chính sách bảo hành/giao hàng có liên kết tới trang chính sách tương ứng; liên kết "Hướng dẫn đo size" tới `/pages/huong-dan-do-size`.

### Admin
- `/admin/banners`: bảng/thẻ, thêm/sửa trong modal (tải ảnh lên qua `/admin/media/images` có xem trước và tiến trình, kiểm tra loại và dung lượng phía client, tiêu đề, liên kết, vị trí, thứ tự, bật/tắt), xóa bằng swal.
- `/admin/menus`: tab Đầu trang / Chân trang, cây hai cấp, thêm/sửa trong modal (nhãn, đường dẫn, mục cha chỉ chọn mục gốc, thứ tự, bật/tắt), đổi thứ tự bằng nút lên/xuống, xóa bằng swal (mục có con: thông báo xóa con trước).
- `/admin/articles` (danh sách có tìm kiếm debounce 500ms, lọc nháp/đã đăng, phân trang) và `/admin/articles/new`, `/admin/articles/[id]`: form tiêu đề, slug tùy chọn, tóm tắt, ảnh đại diện (tải lên), nội dung Markdown với hai tab "Soạn" và "Xem trước" (dùng `MarkdownContent`), nút Lưu nháp và Đăng, cảnh báo rời trang khi chưa lưu, đếm ký tự.
- `/admin/pages`: danh sách (nhãn "Trang hệ thống" cho trang dành riêng), sửa tiêu đề/nội dung Markdown có xem trước/bật tắt hiển thị; trang hệ thống không đổi slug và không xóa; tạo trang mới được.
- `/admin/faqs`: bảng + modal (câu hỏi, câu trả lời, từ khóa nhập dạng chip hoặc chuỗi cách nhau dấu phẩy, thứ tự, bật/tắt), xóa bằng swal; khối thử chatbot nhanh (nhập câu hỏi, xem câu trả lời mà chatbot sẽ trả) dùng `POST /chatbot/ask`.
- `/admin/settings`: thêm phần "Thông tin cửa hàng" (các trường site-info, kiểm tra theo bảng ở trên), cùng trang với phần chuyển khoản hiện có (chia mục/tab rõ ràng).
- Hóa đơn in (`/admin/orders/[id]/invoice`): hiển thị hotline, địa chỉ, email của cửa hàng từ `GET /site-info` bên cạnh tên cửa hàng.
- Sidebar admin: bật các mục Banner, Menu, Bài viết, Trang nội dung, Hỏi đáp (mục chưa làm ở giai đoạn sau giữ mờ "Sắp có").

Quy ước giao diện giữ nguyên: toast cho kết quả, `confirmAction` (SweetAlert2) cho xác nhận, token ở `sessionStorage`, trạng thái loading/empty/error, responsive, tiếng Việt, gọn theo hệ thiết kế hiện có.
