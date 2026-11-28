# TICKETSHIELD FRONTEND - REST API CONTRACT OVERVIEW

Tài liệu đặc tả hợp đồng dữ liệu giữa Frontend Monorepo (`@ticketshield/api-client`) và Backend (`TicketShield.Core` / `MockOrganizer.API`).

---

## 1. Xác Thực & Người Dùng (`auth.api.ts`)
* `POST /api/v1/auth/login`: Đăng nhập hệ thống -> Trả về `{ user, token, refreshToken }`.
* `POST /api/v1/auth/register`: Đăng ký tài khoản người dùng -> `{ fullName, email, phoneNumber, password, role }`.
* `POST /api/v1/auth/google`: Đăng nhập/Đăng ký nhanh qua tài khoản Google OAuth2.
* `POST /api/v1/auth/refresh-token`: Cấp mới access token từ refresh token hợp lệ.
* `GET /api/v1/auth/me`: Lấy thông tin hồ sơ người dùng hiện tại (kèm vai trò và quyền hạn).

---

## 2. Quản Trị Đối Tác & Cổng Kết Nối (`admin.api.ts`)
* `GET /api/v1/admin/organizers`: Lấy danh sách đối tác Ban tổ chức (kèm số lượng sự kiện và trạng thái kết nối).
* `GET /api/v1/admin/organizers/{id}`: Lấy chi tiết cấu hình đối tác, danh mục sự kiện và các hạng vé.
* `POST /api/v1/admin/organizers`: Khởi tạo hồ sơ Ban tổ chức mới.
* `PUT /api/v1/admin/organizers/{id}/connection`: Cập nhật cấu hình gRPC, BaseUrl & Webhook Secret Key.
* `DELETE /api/v1/admin/organizers/{id}`: Xóa đối tác khỏi hệ thống.
* `POST /api/v1/admin/organizers/{id}/test-connection`: Gửi tín hiệu kiểm tra độ trễ mạng và kết nối gRPC (Probe).
* `POST /api/v1/admin/organizers/{id}/sync-events`: Đồng bộ danh mục sự kiện và vé từ cổng sơ cấp về sàn thứ cấp.

---

## 3. Quản Lý Tài Khoản Ngân Hàng (`bankAccounts.api.ts`)
* `GET /api/v1/user-bank-accounts`: Lấy danh sách tài khoản thụ hưởng của người dùng.
* `POST /api/v1/user-bank-accounts`: Đăng ký tài khoản ngân hàng nhận tiền giải ngân (VietinBank, Vietcombank...).
* `DELETE /api/v1/user-bank-accounts/{id}`: Hủy liên kết tài khoản ngân hàng.

---

## 4. Chuyển Nhượng & Niêm Yết Vé P2P (`resaleListings.api.ts` & `resale.api.ts`)
* `GET /api/v1/resale-listings`: Lấy danh sách vé đang bán công khai trên chợ Marketplace (hỗ trợ lọc theo sự kiện, giá trần).
* `GET /api/v1/resale-listings/{id}`: Lấy thông tin chi tiết tin niêm yết (hạng vé, khán đài, giá gốc, giá bán, thời gian giải ngân).
* `POST /api/v1/resale-listings/verify-otp`: Xác thực mã OTP gửi về email từ Ban tổ chức để khóa vé gốc.
* `POST /api/v1/resale-listings`: Đăng bán vé chính chủ sau khi xác thực thành công (chặn cứng không vượt trần giá).
* `POST /api/v1/resale-listings/bundle`: Đăng bán gói Combo nhiều vé trong 1 giao dịch nguyên tử.
* `POST /api/v1/resale-listings/{id}/hold`: Giữ chỗ mua vé trong 10 phút để thực hiện thanh toán.
* `POST /api/v1/resale-listings/{id}/release-hold`: Giải phóng giữ chỗ khi người mua hủy giao dịch hoặc hết hạn 10 phút.

---

## 5. Mua Vé Sơ Cấp & Chống Bot (`organizerStore.api.ts`)
* `GET /api/organizer/orders/session?tierId={tierId}`: Cấp phát SessionToken chứa server timestamp phục vụ đo `time_to_checkout`.
* `POST /api/organizer/orders/checkout`: Gửi yêu cầu mua vé kèm vector hành vi (`is_webdriver`, `action_interval_std_dev`).
  - Phản hồi `HTTP 200`: Cho phép giao dịch (Allow).
  - Phản hồi `HTTP 403`: Yêu cầu thử thách xác minh (Challenge).
  - Phản hồi `HTTP 429`: Chặn đứng hành vi tự động nghi vấn (Block).
* `POST /api/organizer/orders/{orderId}/pay`: Xác nhận thanh toán hóa đơn và nhận mã vé QR chính chủ từ Ban tổ chức.

---

## 6. Khiếu Nại & Tranh Chấp (`disputes.api.ts`)
* `POST /api/v1/disputes`: Người mua gửi khiếu nại vé lỗi tại cổng trong thời gian đệm 24h (đóng băng giải ngân Escrow).
* `GET /api/v1/disputes/my-disputes`: Danh sách khiếu nại của cá nhân.
* `GET /api/v1/admin/disputes`: Quản trị viên đối soát khiếu nại dựa trên log quét cổng của Ban tổ chức.
* `POST /api/v1/admin/disputes/{id}/resolve`: Quyết định hoàn tiền cho người mua hoặc bác bỏ khiếu nại gian lận.

---

## 7. Giải Ngân Ký Quỹ (`payouts.api.ts`)
* `GET /api/v1/payouts/history`: Lịch sử nhận tiền chuyển khoản tự động NAPAS 247 của người bán sau khi hết thời gian giữ tiền.
