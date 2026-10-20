# Claude.md

> Tài liệu dành cho dự án dùng **Next.js** (frontend, thư mục `fe`) và **NestJS** (backend, thư mục `be`).

> Sau khi đọc file này, đọc tiếp `skill.md` (quy trình leader + 3 sub-agent be/fe/test).

## Quyết định áp dụng cho Next.js và NestJS

- **Backend (NestJS):** mỗi domain (auth, products, orders...) là một module. Bên trong mỗi module chia `controllers/`, `services/`, `repositories/`, `dtos/`. Các phần dùng chung (`config/`, `exceptions/`, `middlewares/`, `utils/`) nằm ở cấp `src/`.
- **Role:** làm `admin` và `user` trước. Role `manager` (nếu cần) sẽ thêm sau; các ví dụ có `manager` trong tài liệu này chỉ mang tính minh họa.

## Mục tiêu dự án

- Xây dựng hệ thống backend và frontend theo cấu trúc rõ ràng, dễ bảo trì, dễ mở rộng.
- Tách biệt rõ ràng trách nhiệm giữa các tầng, ưu tiên clean code, hiệu năng và độ tin cậy.
- Tuân thủ nghiệp vụ, xử lý lỗi đúng chuẩn, bảo mật và trải nghiệm người dùng tốt.

---

## 1. Backend (be)

### 1.1. Kiến trúc 3 layer rõ ràng

Backend phải tuân theo mô hình 3 layer với sự phân chia trách nhiệm rõ ràng:

1. Controller
   - Chỉ nhận request và trả response.
   - Không chứa logic nghiệp vụ phức tạp.
   - Chỉ validate đầu vào cơ bản hoặc map DTO.
   - Không gọi trực tiếp các thao tác heavy logic quá mức.

2. Service
   - Chứa toàn bộ logic nghiệp vụ.
   - Xử lý chính sách, kiểm tra quyền, định dạng dữ liệu, business rules.
   - Là nơi thực hiện orchestration giữa các component.
   - Không trả về dữ liệu thô từ repository mà phải xử lý logic trước khi trả về cho controller.

3. Repository
   - Chỉ làm nhiệm vụ truy vấn và persist data.
   - Chỉ trả về dữ liệu, không chứa logic nghiệp vụ.
   - Không làm validate business rule, không xử lý permission, không quyết định response.
   - Tối ưu truy vấn, tập trung vào data access.

### 1.2. Yêu cầu thiết kế code

- Code phải clean, dễ đọc, dễ maintain.
- Tách rõ responsibilities giữa các class/module.
- Tránh code lặp, tránh logic bị rải rác.
- Dùng tên biến, hàm, class theo nghĩa rõ ràng.
- Tổ chức module theo chức năng hoặc domain rõ ràng thay vì gom lẫn.
- Cấu trúc thư mục nên theo domain/service layer, ví dụ:
  - `controllers/`
  - `services/`
  - `repositories/`
  - `models/`
  - `dtos/`
  - `exceptions/`
  - `middlewares/`
  - `config/`
  - `utils/`

### 1.3. Database và quan hệ

**QUY ĐỊNH BẮT BUỘC (không được vi phạm):**

- **Không dùng decorator quan hệ của ORM** trong entity: cấm `@OneToMany`, `@ManyToOne`, `@OneToOne`, `@ManyToMany`, `@JoinColumn`, `@JoinTable`, kiểu `Relation<>`. Lý do: dễ gây N+1 query do lazy/eager loading ngầm.
- Entity **chỉ khai báo các cột** của bảng, kể cả cột khóa ngoại (ví dụ `userId: number`). Muốn lấy dữ liệu liên quan thì repository viết truy vấn rõ ràng (JOIN hoặc batch query `IN (...)`) và chỉ lấy các cột cần dùng.
- **Backend không được tự tạo hoặc sửa bảng**: luôn đặt `synchronize: false`, không dùng `migrationsRun`, không chạy `schema:sync`.
- **Bảng và khóa ngoại được tạo bằng file SQL riêng** trong `be/database/`:
  - `01_create_tables.sql`: tạo bảng và chỉ mục, **không** chứa khóa ngoại.
  - `02_add_foreign_keys.sql`: tạo toàn bộ khóa ngoại bằng `ALTER TABLE ... ADD CONSTRAINT`.
  - Thay đổi lược đồ phải sửa hai file này (và thêm file SQL thay đổi nếu đã có dữ liệu thật), rồi mới sửa entity cho khớp.
- Tên chỉ mục và khóa ngoại đặt rõ nghĩa: `idx_<bảng>_<cột>`, `uq_<bảng>_<cột>`, `fk_<bảng>_<cột>`.

**Nguyên tắc chung:**

- Mỗi bảng có quan hệ thì kết nối thô với nhau theo đúng cấu trúc dữ liệu logic.
- Không tạo các quan hệ lỏng lẻo hoặc kế thừa phức tạp không cần thiết.
- Thiết kế schema rõ ràng, dễ hiểu, ít dư thừa.
- Không lưu dữ liệu nhạy cảm dạng plain text nếu không cần thiết.
- Ưu tiên foreign key và index hợp lý theo truy vấn thực tế.

### 1.4. Hiệu năng và tối ưu truy vấn

- Tránh N+1 query bằng cách:
  - dùng eager loading / join / batch query / fetch with relation
  - dùng pagination hợp lý cho list lớn
  - tránh truy vấn lặp lại trong vòng lặp
- Dùng index cho các cột filter, sort, join thường xuyên.
- Không query dữ liệu thừa, chỉ lấy fields cần dùng.
- Ưu tiên xử lý bulk nếu cần.
- Cân nhắc cache khi dữ liệu read-heavy, có thể dùng Redis.

### 1.5. Xử lý concurrency và race condition

- Phải phòng tránh race condition khi nhiều request cùng tác động vào cùng dữ liệu.
- Dùng transaction cho các thao tác liên quan đến cập nhật dữ liệu.
- Khi cần, dùng optimistic locking hoặc pessimistic locking tùy tình huống.
- Tránh các logic cập nhật không atomic như: read -> modify -> save mà không khóa hoặc kiểm tra điều kiện.
- Với các nghiệp vụ có tính toán dựa trên trạng thái hiện tại, cần kiểm tra điều kiện lại trước khi persist.
- Nếu hệ thống phức tạp, có thể dùng Redis để lock hoặc distributed lock khi cần.

### 1.6. Redis và Kafka

- Có thể dùng Redis cho:
  - cache dữ liệu đọc nhiều
  - session/token cache nếu cần
  - rate limiting
  - distributed lock
- Có thể dùng Kafka cho các tác vụ nặng và bất đồng bộ:
  - gửi email
  - báo cáo lớn
  - xử lý background job
  - sync dữ liệu với hệ thống khác
  - event-driven workflow
- Tác vụ nặng phải chạy bất đồng bộ qua Kafka hoặc AOP/aspect theo đúng mục đích kỹ thuật.
- Không để các tác vụ nặng block request chính.

### 1.7. Xử lý lỗi và trả lỗi đúng nghiệp vụ

- Bắt lỗi rõ ràng và trả về mã lỗi đúng theo nghiệp vụ.
- Dùng cấu trúc error rõ ràng: mã lỗi, message, status code, chi tiết nếu cần.
- Mã trạng thái nên tuân thủ chuẩn:
  - `401 Unauthorized`: xác thực không thành công / token sai / token hết hạn
  - `403 Forbidden`: không có quyền truy cập
  - `404 Not Found`: không tìm thấy resource
  - `400 Bad Request`: dữ liệu đầu vào không hợp lệ
  - `409 Conflict`: xung đột dữ liệu / trạng thái
  - `500 Internal Server Error`: lỗi hệ thống không mong đợi
- Không trả lỗi mơ hồ hoặc generic message trong các case nghiệp vụ rõ ràng.
- Mỗi exception nên có mức xử lý đúng: business exception, validation exception, auth exception, access denied exception.
- Logs cần đủ để debug nhưng không lộ dữ liệu nhạy cảm.

### 1.8. Token và thời hạn

- Token hết hạn sẽ là 1 ngày.
- Time-to-live (TTL) của token phải được quản lý rõ ràng.
- Nếu token hết hạn, hệ thống phải trả `401` rõ ràng.
- Nếu token sai / không hợp lệ, trả `401`.
- Nếu người dùng không có quyền, trả `403`.

### 1.9. Mức độ trách nhiệm từng tầng

- Repository:
  - chỉ truy vấn dữ liệu
  - không xử lý logic nghiệp vụ
  - không chuyển đổi response cho client
- Service:
  - xử lý business logic
  - kiểm tra quyền và xác thực nghiệp vụ
  - orchestrate repository và external components
- Controller:
  - chỉ nhận request
  - chỉ chuyển dữ liệu vào service
  - trả response phù hợp

### 1.10. Bất đồng bộ và background processing

- Những tác vụ nặng hoặc không cần user phải chờ nên chuyển sang background.
- Dùng Kafka hoặc aspect-based async processing cho các job như:
  - gửi email
  - khởi tạo báo cáo
  - xử lý upload/convert file
  - đồng bộ dữ liệu với bên thứ ba
  - event processing phức tạp
- API nên trả response nhanh và không chặn bởi các nhiệm vụ nặng.

---

## 2. Frontend (fe)

### 2.1. Cấu trúc frontend rõ ràng

Frontend phải có cấu trúc phân tách rõ ràng, dễ scale và dễ bảo trì, ví dụ:

- `routes/`
- `pages/`
- `components/`
- `layouts/`
- `hooks/`
- `services/`
- `store/`
- `utils/`
- `constants/`
- `guards/`
- `styles/`

### 2.2. Route bảo vệ trước đăng nhập

- Các route cần bảo vệ trước khi người dùng đăng nhập phải được kiểm soát bằng guard hoặc route middleware.
- Nếu chưa đăng nhập, redirect về trang login.
- Không cho phép truy cập các route private bằng URL trực tiếp.
- Có thể chia route thành:
  - public routes
  - private routes
  - role-based routes

### 2.3. Token và lưu trữ

- Token phải được lưu ở `sessionStorage` (key `accessToken`): mỗi tab đăng nhập riêng, đóng tab là mất phiên. Không lưu token ở `localStorage`.
- Dùng `axios` làm HTTP client chính.
- Thiết lập interceptor để xử lý token và lỗi toàn cục.
- Token từ backend phải chứa ít nhất:
  - `email`
  - `role`
  - `id` của người dùng
- Trang đăng nhập sẽ dùng chung cho tất cả role và phải điều hướng đến trang tương ứng với role được gán trong token của backend.
- Sau khi đăng nhập thành công, hệ thống phải đọc role từ token và redirect tới route tương ứng, ví dụ:
  - admin -> `/admin`
  - user -> `/user`
  - manager -> `/manager`
- Khi token hết hạn hoặc token sai:
  - chuyển về trang login
  - xóa token cũ
  - không giữ session cũ
- Khi không đủ quyền:
  - nếu là role-based, chỉ hiển thị giao diện tương ứng với quyền hoặc hiển thị thông báo không có quyền
  - ưu tiên xử lý rõ ràng theo từng role

### 2.4. Interceptor và xử lý lỗi

- `axios interceptor` cần handle:
  - token attach vào request
  - kiểm tra `401` => redirect login
  - kiểm tra `403` => hiển thị message hoặc chuyển sang màn hình không có quyền
  - xử lý lỗi mạng, timeout, server error theo chuẩn.
- Khi token hết hạn, không để app treo hoặc loop request vô hạn.
- Xử lý lỗi nhất quán ở một nơi để tránh lặp lại logic trên mỗi màn hình.

### 2.5. Phân quyền theo role

- Hệ thống phải hỗ trợ kiểm soát quyền theo role rõ ràng.
- Có thể thực hiện:
  - route guard
  - permission check trước khi render component
  - UI tương ứng cho từng role
- Nếu không đủ quyền:
  - not authorized UI hoặc message “Không có quyền truy cập”
  - không cho phép thao tác nếu không đủ quyền

### 2.6. Responsive UI

- Giao diện phải responsive trên nhiều kích thước màn hình.
- Hỗ trợ mobile, tablet, desktop.
- Layout cần co giãn hợp lý, không bị vỡ giao diện ở các breakpoints phổ biến.
- Hình ảnh, bảng, form và navigation phải tương thích với màn hình nhỏ.

### 2.7. Tìm kiếm và debounce

- Tìm kiếm có thể áp dụng `useDebounce` với delay là `500ms`.
- Giảm số lượng request khi user gõ liên tục.
- Chỉ gửi request khi người dùng dừng gõ đủ thời gian quy định.
- Tránh gọi API quá nhiều trong lúc nhập liệu.

### 2.8. UX và hiệu năng frontend

- Không render quá nhiều dữ liệu cùng lúc nếu không cần thiết.
- Dùng lazy loading cho route hoặc component cần thiết.
- Tránh re-render không cần thiết bằng memoization khi cần.
- Có thể dùng query caching hoặc store tập trung nếu ứng dụng lớn.
- Xử lý trạng thái loading, empty state, error state rõ ràng.

---

## 3. Nguyên tắc chung áp dụng cho cả backend và frontend

- Tập trung vào clean architecture và separation of concerns.
- Code phải dễ maintain, dễ mở rộng, dễ test.
- Không làm logic rải rác giữa các layer.
- Bắt lỗi sớm và trả response rõ ràng theo nghiệp vụ.
- Tối ưu hiệu năng và tránh các lỗi tiềm ẩn như race condition, N+1 query.
- Ưu tiên bảo mật, quyền hạn, auth và token lifecycle đúng chuẩn.
- Hệ thống phải có trải nghiệm người dùng ổn định trên nhiều màn hình.

---

## 4. Checklist phát triển bắt buộc

- [ ] Backend chia 3 layer rõ ràng
- [ ] Entity không dùng decorator quan hệ (`@OneToMany`, `@ManyToOne`, `@OneToOne`, `@JoinColumn`...), chỉ khai báo cột
- [ ] Bảng và khóa ngoại tạo bằng SQL riêng trong `be/database/`, BE không tự tạo bảng (`synchronize: false`)
- [ ] Repository chỉ đọc/ghi data
- [ ] Service chứa logic nghiệp vụ
- [ ] Controller chỉ nhận request và trả response
- [ ] Mã lỗi đúng theo nghiệp vụ (`401`, `403`, `400`, `404`, `409`, `500`)
- [ ] Token hết hạn = 1 ngày
- [ ] Tác vụ nặng chạy async bằng Kafka hoặc aspect
- [ ] Tránh N+1 query
- [ ] Tránh race condition
- [ ] Dùng Redis khi cần cache / lock
- [ ] Frontend route private được guard
- [ ] Token lưu ở sessionStorage
- [ ] Axios interceptor xử lý 401/403
- [ ] Role-based UI và quyền được kiểm soát rõ ràng
- [ ] Responsive design
- [ ] Search dùng useDebounce với delay 500ms

---

## 5. Gợi ý triển khai mặc định

- Backend: 3-layer architecture + service-based business logic + repository abstraction + proper exception handling.
- Frontend: React/Vue/Next style app với route guards, axios interceptors, sessionStorage token storage, and role-based visibility.
- Background jobs: Kafka for async tasks; Redis for cache/lock.
- Error standardization: unified response format with status code and clear business message.

Giữ nguyên các nguyên tắc này trong toàn bộ quá trình phát triển để đảm bảo hệ thống đúng chuẩn, dễ mở rộng và ổn định.
