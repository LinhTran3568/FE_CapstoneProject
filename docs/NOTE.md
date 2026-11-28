# 🛡️ NOTE HƯỚNG DẪN KIẾN TRÚC & CÁCH CHẠY DỰ ÁN CAPSTONE FE

> **Dự án Capstone Project**: Front-End Monorepo Framework

---

## 📌 1. TỔNG QUAN HỆ THỐNG

Hệ thống bao gồm **khung ứng dụng Front-End chuẩn mực** trên kiến trúc **Monorepo**:

1. **Web Application (`apps/web`)**: Ứng dụng React 18 + Vite + TypeScript + Tailwind CSS tối giản, sạch sẽ, sẵn sàng ghép nối các trang và API.
2. **Mobile Application (`apps/mobile`)**: Ứng dụng React Native + Expo + Expo Router làm khung di động chuẩn.
3. **Các Gói Shared (`packages/`)**:
   - `@ticketshield/types`: Định nghĩa Domain Models & Type interfaces.
   - `@ticketshield/validation`: Schema kiểm tra dữ liệu bằng Zod.
   - `@ticketshield/api-client`: Tầng Service API Client abstraction gọn nhẹ.
4. **Tài liệu Kỹ thuật (`docs/`)**: Kiến trúc chi tiết, Hướng dẫn Frontend, API Contract & Development Guide.

---

## 🏗️ 2. CHI TIẾT CẤU TRÚC KHUNG THƯ MỤC (PROJECT STRUCTURE)

```
FE_CapstoneProject/
│
├── apps/                               # CÁC ỨNG DỤNG CHÍNH
│   ├── web/                            # ỨNG DỤNG WEB (React + Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── components/             # COMPONENT NỀN TẢNG
│   │   │   │   ├── ui/                 # Component UI cơ bản: Button, Card
│   │   │   │   └── layout/             # Navbar, Footer
│   │   │   ├── pages/                  # CÁC TRANG KHUNG THỜI GIAN
│   │   │   │   ├── HomePage.tsx        # Trang chủ khung FE
│   │   │   │   ├── LoginPage.tsx       # Trang đăng nhập
│   │   │   │   ├── RegisterPage.tsx    # Trang đăng ký
│   │   │   │   └── DashboardPage.tsx   # Trang Dashboard cá nhân
│   │   │   ├── routes/                 # AppRoutes, ProtectedRoute
│   │   │   ├── stores/                 # authStore, uiStore
│   │   │   └── styles/                 # index.css (Theme Tailwind Dark Mode)
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── mobile/                         # ỨNG DỤNG MOBILE (React Native + Expo Router)
│       ├── app/
│       │   ├── (tabs)/                 # THANH ĐIỀU HƯỚNG TABS
│       │   │   ├── _layout.tsx
│       │   │   ├── index.tsx           # Home Mobile
│       │   │   ├── marketplace.tsx     # Marketplace Mobile
│       │   │   ├── tickets.tsx         # Tickets Mobile
│       │   │   ├── orders.tsx          # Orders Mobile
│       │   │   └── profile.tsx         # Profile Mobile
│       │   ├── event/[id].tsx
│       │   ├── ticket/[id].tsx
│       │   └── verify.tsx
│       └── package.json
│
├── packages/                           # CÁC GÓI DÙNG CHUNG (SHARED PACKAGES)
│   ├── types/                          # Shared TypeScript Domain Interfaces
│   ├── validation/                     # Zod Validation Schemas
│   └── api-client/                     # Tầng REST API Client Abstraction
│
├── docs/                               # TÀI LIỆU KỸ THUẬT DỰ ÁN
├── package.json                        # Cấu hình Monorepo Workspaces & Scripts gốc
├── README.md                           # README chính thức
└── NOTE.md                             # Ghi chú hướng dẫn
```

---

## ⚡ 3. HƯỚNG DẪN CÁCH CHẠY DỰ ÁN (HOW TO RUN)

### Bước 1: Cài đặt Dependencies Monorepo
```bash
npm install
```

### Bước 2: Chạy Ứng Dụng Web (`apps/web`)
```bash
npm run dev:web
```
* 🌐 **Địa chỉ truy cập Web**: `http://localhost:3000`

### Bước 3: Chạy Ứng Dụng Mobile (`apps/mobile`)

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
