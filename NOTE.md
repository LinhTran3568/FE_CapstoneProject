# 🛡️ NOTE HƯỚNG DẪN KIẾN TRÚC & CÁCH CHẠY DỰ ÁN TICKETSHIELD AI

> **Dự án Capstone Project**: TicketShield AI — AI-Based Bot Detection and Verified Peer-to-Peer Resale Platform for Event Ticket Payments in Vietnam

---

## 📌 1. TỔNG QUAN NHỮNG GÌ ĐÃ ĐƯỢC XÂY DỰNG

Hệ thống bao gồm **2 ứng dụng hoàn chỉnh** trên cấu trúc **Monorepo chuẩn Production**:

1. **Web Application (`apps/web`)**: Ứng dụng React 18 + Vite + TypeScript + Tailwind CSS + Recharts dành cho 4 nhóm người dùng (Người mua vé, Người sang nhượng, Quản trị viên Admin, Ban tổ chức sự kiện).
2. **Mobile Application (`apps/mobile`)**: Ứng dụng React Native + Expo + Expo Router thiết kế trải nghiệm riêng cho điện thoại di động (Ví vé QR điện tử, Chợ vé P2P, Xác thực vé).
3. **Các Gói Shared (`packages/`)**:
   - `@ticketshield/types`: Định nghĩa toàn bộ Domain Model, Enum & Union Type.
   - `@ticketshield/validation`: Schema kiểm tra dữ liệu bằng Zod (Đăng nhập, Đăng ký, Đăng bán vé, Xác thực vé, Thanh toán, Khiếu nại).
   - `@ticketshield/api-client`: Tầng Service gọi API chuẩn RESTful + Dataset Mock giả lập dữ liệu sự kiện Việt Nam thực tế (Giá tiền VNĐ, Concert Anh Trai Vượt Ngàn Chông Gai, Hà Anh Tuấn Live Concert, V-League Derby,...).
4. **Tài liệu Kỹ thuật (`docs/`)**: Kiến trúc chi tiết, Hướng dẫn Frontend, API Contract Spring Boot & Development Guide.

---

## 🏗️ 2. CHI TIẾT CẤU TRÚC KHUNG THƯ MỤC (PROJECT STRUCTURE)

```
FE_CapstoneProject/
│
├── apps/                               # CÁC ỨNG DỤNG CHÍNH
│   ├── web/                            # ỨNG DỤNG WEB (React + Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── components/             # THƯ VIỆN COMPONENT THEO TÍNH NĂNG
│   │   │   │   ├── ui/                 # Component nền tảng: Button, Card, SecurityBadge, VerifiedBadge, RiskBadge, EscrowBadge, BotDecisionBadge
│   │   │   │   ├── layout/             # Navbar (Tích hợp Demo Role Switcher), Footer
│   │   │   │   ├── event/              # EventCard, TicketTypeSelector
│   │   │   │   ├── ticket/             # DigitalTicketCard (Hiển thị QR Code động)
│   │   │   │   ├── marketplace/        # ListingCard (Thẻ niêm yết sang nhượng)
│   │   │   │   ├── checkout/           # BotDecisionCard (Hiển thị điểm rủi ro & phân loại Bot AI), SecurityChallengeModal
│   │   │   │   ├── escrow/             # EscrowTracker (Theo dõi khóa tiền Escrow & nút Xác nhận Check-in)
│   │   │   │   ├── dispute/            # DisputeCard (Thẻ khiếu nại sự cố)
│   │   │   │   ├── admin/              # MetricCard, BotDecisionChart (Biểu đồ Recharts), RiskDistributionChart
│   │   │   │   └── organizer/          # BangQuanLyVe, ApiKeyManager
│   │   │   ├── hooks/                  # Custom Hooks với TanStack Query: useEvents, useListings, useMyTickets, useBotAssessment, useAdminMetrics
│   │   │   ├── pages/                  # 18 TRANG WEB HOÀN CHỈNH
│   │   │   │   ├── HomePage.tsx        # Trang chủ: Banner AI Protection, Sự kiện Hot, Quy trình Escrow
│   │   │   │   ├── EventsPage.tsx      # Danh sách sự kiện + Bộ lọc & Tìm kiếm
│   │   │   │   ├── EventDetailPage.tsx # Chi tiết sự kiện & Chọn hạng vé mua chính thức
│   │   │   │   ├── MarketplacePage.tsx # Sàn sang nhượng vé Verified (Lọc vé xác thực, Sắp xếp giá)
│   │   │   │   ├── MarketplaceDetailPage.tsx # Chi tiết vé nhượng lại + Hồ sơ người bán & Bảo vệ Escrow
│   │   │   │   ├── LoginPage.tsx       # Đăng nhập (Form Zod + Mock Auth JWT)
│   │   │   │   ├── RegisterPage.tsx    # Đăng ký tài khoản (Phân quyền BUYER, RESELLER, ORGANIZER)
│   │   │   │   ├── DashboardPage.tsx   # Tổng quan người dùng & Ví vé cá nhân
│   │   │   │   ├── MyTicketsPage.tsx   # Ví vé điện tử của tôi (Mã QR Check-in động)
│   │   │   │   ├── VerifyTicketPage.tsx# Trang Xác Thực Vé (Đối soát API BTC để nhận huy hiệu Verified)
│   │   │   │   ├── CheckoutPage.tsx    # Trang Thanh Toán & Đánh Giá AI Bot Detection (Hỗ trợ mô phỏng ALLOWED, THROTTLED, BLOCKED)
│   │   │   │   ├── CheckoutSuccessPage.tsx # Trang Thanh toán thành công + Nạp Escrow & Xác nhận cổng
│   │   │   │   ├── DisputesPage.tsx    # Trung tâm khiếu nại sự cố quẹt vé & yêu cầu hoàn tiền Escrow
│   │   │   │   ├── ResellerDashboardPage.tsx # Kênh người bán vé sang nhượng & Thống kê doanh thu
│   │   │   │   ├── CreateListingPage.tsx # Form đăng vé bán nhượng lại (Hướng dẫn giá tránh phe vé)
│   │   │   │   ├── AdminDashboardPage.tsx # Bảng giám sát Admin real-time (Biểu đồ Recharts AI Bot, Bảng nghi vấn Scalping, Audit Logs)
│   │   │   │   ├── AdminBotDetectionPage.tsx # Nhật ký giám sát chi tiết các phiên làm việc AI Bot
│   │   │   │   ├── AdminResaleMonitoringPage.tsx # Giám sát thị trường nhượng lại & cờ báo phe vé
│   │   │   │   └── OrganizerDashboardPage.tsx # Cổng Ban Tổ Chức (Quản lý API Key tích hợp & Nhật ký Webhooks)
│   │   │   ├── routes/                 # AppRoutes, ProtectedRoute, RoleGuard
│   │   │   ├── stores/                 # authStore (Lưu User, Token, Chuyển vai trò Demo), uiStore (Toast thông báo)
│   │   │   ├── styles/                 # index.css (Theme Dark Navy An Ninh & Bảo Mật)
│   │   │   └── utils/                  # Định dạng tiền VNĐ (e.g. 1.200.000 ₫) & Ngày tháng tiếng Việt
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── mobile/                         # ỨNG DỤNG MOBILE (React Native + Expo Router)
│       ├── app/
│       │   ├── (tabs)/                 # THANH ĐIỀU HƯỚNG BOTTOM TABS
│       │   │   ├── _layout.tsx         # Cấu hình Tabs
│       │   │   ├── index.tsx           # Mobile Home (Banner an ninh, Thao tác nhanh, Sự kiện hot)
│       │   │   ├── marketplace.tsx     # Mobile Chợ Vé Sang Nhượng Verified
│       │   │   ├── tickets.tsx         # Mobile Ví Vé Điện Tử (QR Code Check-in)
│       │   │   ├── orders.tsx          # Mobile Lịch Sử Đơn Hàng & Khóa Tiền Escrow
│       │   │   └── profile.tsx         # Mobile Hồ Sơ & Cài Đặt An Ninh
│       │   ├── event/[id].tsx          # Chi tiết sự kiện mobile
│       │   ├── ticket/[id].tsx         # Màn hình vé điện tử chi tiết
│       │   └── verify.tsx              # Màn hình xác thực vé AI trên di động
│       ├── app.json
│       ├── babel.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                           # CÁC GÓI DÙNG CHUNG (SHARED PACKAGES)
│   ├── types/                          # TypeScript Domain Models & Interfaces
│   │   └── src/index.ts                # Định nghĩa User, Event, Ticket, TicketListing, Escrow, BotSession, Dispute, AdminMetric,...
│   ├── validation/                     # Zod Validation Schemas
│   │   └── src/index.ts                # Form Schemas cho Login, Register, CreateListing, VerifyTicket, Checkout, Dispute
│   └── api-client/                     # Tầng API Client & Mock Data Việt Nam
│       └── src/
│           ├── mocks/                  # Dữ liệu mẫu thực tế: Sự kiện VN, Vé chính chủ, Đơn hàng, Phiên Bot AI, Admin Metrics
│           └── services/               # Abstraction Services (auth, events, tickets, listings, orders, payments, escrow, verification, botDetection, disputes, admin, organizer)
│
├── docs/                               # TÀI LIỆU KỸ THUẬT DỰ ÁN
│   ├── architecture.md                 # Sơ đồ kiến trúc & luồng dữ liệu AI / Escrow
│   ├── frontend-guidelines.md          # Quy chuẩn thiết kế UI/UX & Design Tokens
│   ├── api-contract.md                 # Quy ước RESTful API kết nối Spring Boot
│   └── development-guide.md            # Hướng dẫn phát triển & tích hợp
│
├── package.json                        # Cấu hình Monorepo Workspaces & Scripts gốc
├── pnpm-workspace.yaml                 # Cấu hình pnpm workspace
├── README.md                           # README chính thức của dự án
└── NOTE.md                             # File ghi chú hướng dẫn này
```

---

## ⚡ 3. HƯỚNG DẪN CÁCH CHẠY DỰ ÁN (HOW TO RUN)

### Yêu cầu môi trường:
* **Node.js**: v18+ hoặc v20+ / v24+
* **npm**: v9+ hoặc v10+ / v11+ (hoặc `pnpm`)

---

### Bước 1: Cài đặt Dependencies Monorepo

Mở Terminal tại thư mục gốc dự án (`FE_CapstoneProject`) và chạy lệnh:

```bash
npm install
```

---

### Bước 2: Chạy Ứng Dụng Web (`apps/web`)

Để chạy giao diện Web trên môi trường Development:

```bash
npm run dev:web
```

* 🌐 **Địa chỉ truy cập Web**: `http://localhost:3000`
* 💡 **Tính năng đặc biệt cho Đồ Án Capstone**: 
  - Tại thanh Header phía trên cùng, có sẵn **Demo Role Switcher** cho phép bạn chuyển đổi nhanh giữa 4 vai trò:
    1. `BUYER` (Người Mua Vé)
    2. `RESELLER` (Người Bán Vé Sang Nhượng)
    3. `ORGANIZER` (Ban Tổ Chức Sự Kiện)
    4. `ADMIN` (System Administrator)
  - Tại bước **Checkout**, giao diện có bảng điều khiển mô phỏng trạng thái Bot AI (`ALLOWED`, `THROTTLED` - mở CAPTCHA, `BLOCKED` - khóa phiên) để bạn dễ dàng trình diễn cho Hội đồng đánh giá đồ án.

---

### Bước 3: Chạy Ứng Dụng Mobile (`apps/mobile`)

Để khởi chạy ứng dụng di động React Native Expo:

```bash
npm run dev:mobile
```

* 📱 **Thao tác**:
  - Giao diện Expo Developer Tools sẽ mở ra.
  - Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại (Android / iOS).
  - Hoặc nhấn `w` để mở phiên bản Web Mobile thử nghiệm trên trình duyệt.

---

### Bước 4: Kiểm Tra Kiểm Lỗi TypeScript (Typecheck)

Để đảm bảo toàn bộ Codebase không có bất kỳ lỗi kiểu dữ liệu (TypeScript strict mode):

```bash
npm run typecheck
```

*(Kết quả đã kiểm tra: Passed 100% không có lỗi trên cả `apps/web` và `apps/mobile`)*

---

### Bước 5: Build Bundle Sản Xuất (Production Build)

Khi muốn đóng gói Web cho Production:

```bash
npm run build:web
```

*(Kết quả Build xuất ra thư mục `apps/web/dist` sẵn sàng deploy lên Vercel / Netlify / Nginx)*

---

## 🔗 4. HƯỚNG DẪN TÍCH HỢP BACKEND SPRING BOOT SAU NÀY

Tất cả các hàm gọi dữ liệu trong giao diện Web và Mobile hiện tại đều thông qua tầng abstraction service tại `@ticketshield/api-client`.

Khi hệ thống Backend Spring Boot hoàn thành:
1. Mở file `apps/web/.env` và thay đổi URL backend:
   ```env
   VITE_API_BASE_URL=https://api.ticketshield.vn/api/v1
   ```
2. Mở file `apps/mobile/.env` và thay đổi URL backend:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://api.ticketshield.vn/api/v1
   ```
3. Chuyển đổi cờ mock trong `packages/api-client/src/services/client.ts` từ mock data sang `fetch()` REST API.
4. **Không cần viết lại bất kỳ trang giao diện (Page) hay component nào**, vì các DTO contract đã được đồng bộ 1-to-1.
