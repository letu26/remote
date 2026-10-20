# API Contract - Giai đoạn 1 (Nền tảng + Auth), bản 2: OTP + blacklist

Do leader chốt. be, fe, test đều bám theo file này. Muốn đổi hợp đồng thì báo leader, không tự sửa.
Bản 2 thay thế luồng "link đặt lại mật khẩu" cũ bằng luồng OTP qua email và thêm blacklist token.

- Base URL: `http://localhost:4000/api` (be). fe chạy `http://localhost:3000`. be bật CORS cho `FRONTEND_URL`.
- Body và response là JSON, tên trường camelCase.
- Xác thực: header `Authorization: Bearer <accessToken>`.

## Token (JWT HS256)

- Secret: `JWT_SECRET`, hết hạn `JWT_EXPIRES_IN=1d`.
- Payload: `{ "sub": <id>, "id": <id>, "email": "...", "role": "admin" | "user", "jti": "<uuid>", "iatMs": <thời điểm cấp, mili giây>, "iat": ..., "exp": ... }`.
  - `jti` là mã duy nhất của token (dùng cho blacklist). `iatMs` dùng để so với mốc thu hồi chính xác đến mili giây.
- Token hết hạn: `401 TOKEN_EXPIRED`. Token sai: `401 TOKEN_INVALID`. Không có token: `401 UNAUTHORIZED`. Không đủ quyền: `403 FORBIDDEN`.

## Blacklist token (lưu trong DB, bảng `token_blacklist`)

Mỗi request có token, `JwtAuthGuard` ngoài kiểm tra chữ ký/hạn còn phải kiểm tra DB:
1. Token bị thu hồi? Có dòng `scope='token'` với `jti` của token, HOẶC có dòng `scope='all_before'` của `userId` với `issuedBefore` > thời điểm cấp token (`iatMs`). Nếu có: `401 TOKEN_REVOKED` ("Phiên đăng nhập đã hết hiệu lực, vui lòng đăng nhập lại").
2. Tài khoản còn tồn tại và `status='active'`. Bị khóa: `403 ACCOUNT_LOCKED`. Không còn tồn tại: `401 TOKEN_INVALID`.
Token cấp SAU mốc thu hồi vẫn hợp lệ (đăng nhập lại ngay sau khi đổi mật khẩu phải dùng được, kể cả trong cùng một giây; vì thế so sánh bằng `iatMs`).

Bảng `token_blacklist` (đã tạo trong DB, xem `be/database/changes/001_otp_blacklist.sql`): `id, createdAt, updatedAt, userId, scope ('token'|'all_before'), jti (unique, null với all_before), issuedBefore (datetime(3), chỉ với all_before), reason ('logout'|'change_password'|'reset_password'), expiresAt`.
- Đăng xuất: thêm dòng `scope='token'`, `jti` của token đang dùng, `expiresAt` = `exp` của token.
- Đổi mật khẩu, đặt lại mật khẩu: thêm dòng `scope='all_before'`, `issuedBefore` = thời điểm hiện tại (mili giây), `expiresAt` = bây giờ + `JWT_EXPIRES_IN` (sau thời điểm đó mọi token cũ đã tự hết hạn). Hiệu lực: **mọi token cũ của tài khoản** (kể cả máy khác) không dùng được nữa.
- Dọn dòng đã quá `expiresAt` định kỳ hoặc khi ghi (không được làm chậm request chính).

## Định dạng lỗi thống nhất

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "details": [{ "field": "phone", "message": "Số điện thoại không hợp lệ" }],
  "timestamp": "2026-10-17T00:00:00.000Z",
  "path": "/api/auth/register"
}
```

`details` chỉ có khi là lỗi validate; `details[].field` là đúng tên thuộc tính trong body. Mã lỗi (`code`):
`VALIDATION_ERROR` (400), `INVALID_CREDENTIALS` (401), `TOKEN_EXPIRED` (401), `TOKEN_INVALID` (401), `TOKEN_REVOKED` (401), `UNAUTHORIZED` (401), `ACCOUNT_LOCKED` (403), `FORBIDDEN` (403), `NOT_FOUND` (404), `PHONE_ALREADY_EXISTS` (409), `EMAIL_ALREADY_EXISTS` (409), `OTP_INVALID` (400), `OTP_EXPIRED` (400), `OTP_TOO_MANY_ATTEMPTS` (429), `OTP_RATE_LIMITED` (429, kèm `retryAfterSeconds`), `RESET_TOKEN_INVALID` (400), `INTERNAL_ERROR` (500).
Message viết tiếng Việt, rõ nghĩa theo nghiệp vụ. Không trả stack trace hay dữ liệu nhạy cảm. Request không có token: `UNAUTHORIZED`; route không tồn tại: 404 `NOT_FOUND`; JSON hỏng: 400 `VALIDATION_ERROR`. ValidationPipe dùng `whitelist: true`, KHÔNG `forbidNonWhitelisted` (trường lạ như `role` bị bỏ qua).

## Validate chung

- `phone`: số điện thoại Việt Nam, 10 số, bắt đầu bằng `0`. Là tên đăng nhập, duy nhất.
- `email`: đúng định dạng, duy nhất, lưu chữ thường.
- `password`/`newPassword`: tối thiểu 6 ký tự, tối đa 72. Lưu bằng bcrypt, không bao giờ trả về.
- `fullName`: 2 đến 100 ký tự.
- `otp`: đúng 6 chữ số.
- Không để trống các trường bắt buộc.

## Redis (OTP và mã đặt lại)

Redis chạy bằng `docker compose` ở thư mục `jewelry-shop`, kết nối bằng `REDIS_URL` trong `be/.env`. Redis chỉ dùng cho OTP và mã đặt lại. Mọi key dùng tiền tố `jewelry:`. Email trong key luôn là SHA-256 của email đã chuẩn hóa (chữ thường), không lưu email thô trong key.

| Key | Giá trị | TTL |
|---|---|---|
| `jewelry:otp:forgot:<sha256(email)>` | `{ "hash": "<HMAC-SHA256 của OTP>", "attempts": <số lần nhập sai> }` | `OTP_TTL_SECONDS` = **120 giây** |
| `jewelry:otp:cooldown:<sha256(email)>` | `1` | `OTP_RESEND_COOLDOWN_SECONDS` = 60 giây |
| `jewelry:reset:<sha256(resetToken)>` | `<userId>` | `RESET_TICKET_TTL_SECONDS` = 600 giây |

- OTP: 6 chữ số sinh bằng `crypto.randomInt` (không dùng `Math.random`), **không lưu OTP thô**. Lưu `HMAC-SHA256(OTP_SECRET, email + ":" + otp)`; so sánh bằng `timingSafeEqual`.
- Số lần nhập sai tối đa `OTP_MAX_ATTEMPTS` = 5, tăng bằng thao tác atomic của Redis (không read-modify-write).

## Endpoints

### POST /auth/register (public)
Request: `{ fullName, email, phone, password, confirmPassword, acceptTerms }`
- `acceptTerms` phải là `true`; `confirmPassword` phải bằng `password`.
- 201: `{ "user": { id, fullName, email, phone, role: "user", status: "active" } }`
- 400 `VALIDATION_ERROR`, 409 `PHONE_ALREADY_EXISTS` / `EMAIL_ALREADY_EXISTS`. Chỉ tạo role `user`.

### POST /auth/login (public)
Request: `{ phone, password }`
- 200: `{ "accessToken": "...", "user": { id, fullName, email, phone, role } }`
- 401 `INVALID_CREDENTIALS` (không nói rõ sai số điện thoại hay mật khẩu). 403 `ACCOUNT_LOCKED`.
- Token có `jti` mới (uuid) và `iatMs`.

### POST /auth/logout (cần token)
- 200: `{ "message": "Đăng xuất thành công" }`
- Đưa `jti` của token đang dùng vào blacklist. Gọi lại với cùng token: 401 `TOKEN_REVOKED`.

### POST /auth/forgot-password (public) - bước 1: gửi OTP
Request: `{ email }`
- Luôn trả 200 `{ "message": "Nếu email tồn tại, chúng tôi đã gửi mã OTP", "expiresInSeconds": 120, "resendAfterSeconds": 60 }` (không lộ email có tồn tại hay không).
- Nếu đang trong thời gian chờ gửi lại (key cooldown còn): 429 `OTP_RATE_LIMITED` kèm `retryAfterSeconds`. Cooldown áp dụng cho MỌI email (kể cả email không tồn tại) để hành vi giống nhau.
- Nếu email tồn tại và tài khoản `active`: sinh OTP mới (ghi đè OTP cũ, đặt lại `attempts`=0), lưu hash vào Redis TTL 120s, đặt cooldown, gửi email chứa OTP và nói rõ hiệu lực 2 phút. Gửi mail bất đồng bộ, không chặn response, lỗi gửi mail chỉ ghi log. Email không tồn tại hoặc bị khóa: không gửi gì (vẫn đặt cooldown).

### POST /auth/verify-otp (public) - bước 2: xác thực OTP
Request: `{ email, otp }`
- 200: `{ "resetToken": "<chuỗi ngẫu nhiên 32 byte, hex>", "expiresInSeconds": 600 }`. Khi đúng: xóa OTP khỏi Redis (dùng một lần), lưu `jewelry:reset:<sha256(resetToken)>` -> userId, TTL 600s.
- OTP sai: 400 `OTP_INVALID` (tăng `attempts`). Body lỗi có thêm trường số `remainingAttempts` (số lần thử còn lại = `OTP_MAX_ATTEMPTS` - số lần đã sai, ví dụ sai lần 1 thì còn 4), cùng cấp với `code` và `message` giống `retryAfterSeconds`. Chạm 5 lần sai (còn 0): xóa OTP và trả 429 `OTP_TOO_MANY_ATTEMPTS` (phải yêu cầu OTP mới); lỗi này không cần `remainingAttempts`.
- Không có OTP trong Redis (hết 2 phút, chưa yêu cầu, hoặc email không tồn tại): 400 `OTP_EXPIRED`.

### POST /auth/reset-password (public) - bước 3: đặt mật khẩu mới
Request: `{ resetToken, newPassword, confirmPassword }`
- 200: `{ "message": "Đặt lại mật khẩu thành công" }`
- 400 `RESET_TOKEN_INVALID` nếu mã sai, hết hạn hoặc đã dùng. Lấy mã bằng thao tác atomic `GETDEL` để chỉ một request thành công khi có hai request song song.
- Thành công: đổi mật khẩu (băm bcrypt) VÀ ghi blacklist `all_before` của tài khoản, trong cùng một transaction DB. Mọi token cũ của tài khoản bị vô hiệu.

### PATCH /users/me/password (cần token) - đổi mật khẩu khi đã đăng nhập
Request: `{ currentPassword, newPassword, confirmPassword }`
- 200: `{ "message": "Đổi mật khẩu thành công, vui lòng đăng nhập lại" }`
- 400 `VALIDATION_ERROR` nếu `currentPassword` sai hoặc confirm không khớp.
- Thành công: đổi mật khẩu VÀ ghi blacklist `all_before` (transaction). Token đang dùng cũng bị vô hiệu: fe phải xóa token và chuyển về `/login`.

### GET /users/me (cần token)
- 200: `{ id, fullName, email, phone, role, status, createdAt }`

### PATCH /users/me (cần token)
Request (tùy chọn): `{ fullName?, email?, phone? }`
- 200: user sau khi cập nhật. 409 nếu trùng email/số điện thoại của người khác.

### GET /admin/ping (cần token role admin)
- 200: `{ "message": "pong", "admin": { id, email } }`. 401 nếu không/sai token, 403 nếu role không phải admin.

## Trang frontend (mỗi chức năng một trang riêng)

| Trang | Quyền | Việc |
|---|---|---|
| `/login` | khách | Đăng nhập bằng số điện thoại, điều hướng theo role (`admin` -> `/admin`, `user` -> `/user`) |
| `/register` | khách | Đăng ký |
| `/logout` | đã đăng nhập | Gọi `POST /auth/logout`, xóa token, chuyển `/login` (dù API lỗi vẫn xóa token cục bộ) |
| `/forgot-password` | khách | Nhập email, gửi OTP, chuyển `/verify-otp` |
| `/verify-otp` | khách | Nhập 6 số OTP, đếm ngược 2:00, nút "Gửi lại mã" bật sau 60s, đúng thì chuyển `/reset-password` |
| `/reset-password` | khách có `resetToken` | Mật khẩu mới + xác nhận, xong chuyển `/login`. Không có `resetToken` thì về `/forgot-password` |
| `/change-password` | đã đăng nhập (mọi role) | Mật khẩu hiện tại, mới, xác nhận; thành công thì xóa token và về `/login` |

- `email` và `resetToken` của luồng quên mật khẩu giữ trong `sessionStorage`, xóa ngay khi xong hoặc khi thoát luồng. Token đăng nhập cũng ở `sessionStorage` (key `accessToken`), không dùng `localStorage`.
- Mọi `401` (kể cả `TOKEN_REVOKED`) xử lý ở interceptor như cũ: xóa token, về `/login`. `403 ACCOUNT_LOCKED` từ guard cũng xóa token và về `/login` kèm thông báo.

## Quy ước khác

- Tài khoản admin tạo bằng `npm run seed:admin -- <phone> <email> <password>` trong `be`.
- Tuyệt đối không in nội dung `be/.env` ra log hay báo cáo. Không bao giờ log OTP, resetToken hay mật khẩu.
- Bảng `password_reset_tokens` (luồng cũ) không còn dùng; code phải bỏ entity, repository và logic liên quan. Bảng cũ vẫn còn trong DB cho tới khi người dùng chạy `be/database/changes/002_drop_password_reset_tokens.sql`.
- Schema DB đổi bằng file SQL trong `be/database/`, BE không tự tạo/sửa bảng.
