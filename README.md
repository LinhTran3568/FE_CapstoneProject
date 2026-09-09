# TicketShield AI - Frontend Codebase Foundation

> **AI-Based Bot Detection & Verified Peer-to-Peer Resale Platform for Event Ticket Payments in Vietnam**

---

## 🛡️ Overview

TicketShield AI is a modern monorepo frontend codebase engineered for high-demand ticket sales, verified P2P resale marketplaces, bot detection risk assessment, escrow payment protection, venue check-in verification, and admin monitoring.

---

## 🏗️ Monorepo Architecture

```
ticketshield-ai/
├── apps/
│   ├── web/         # React 18 + Vite + Tailwind CSS + Recharts Web App
│   └── mobile/      # React Native + Expo + Expo Router Mobile App
├── packages/
│   ├── types/       # Shared TypeScript domain models & discriminated unions
│   ├── validation/  # Zod validation schemas for forms
│   └── api-client/  # Mock API layer & Spring Boot REST API client abstraction
└── docs/            # Architecture & API documentation
```

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Web Application
npm run dev:web

# 3. Start Mobile Application
npm run dev:mobile

# 4. Typecheck workspace
npm run typecheck
```

---

## 🔑 Core Features & Navigation

### Web Application Routes
- **Public**: `/`, `/events`, `/events/:eventId`, `/marketplace`, `/marketplace/:listingId`, `/login`, `/register`, `/forgot-password`
- **Buyer**: `/dashboard`, `/my-tickets`, `/orders`, `/orders/:orderId`, `/wallet`, `/notifications`, `/profile`
- **Reseller**: `/seller`, `/seller/listings`, `/seller/listings/new`, `/seller/listings/:listingId`, `/seller/sales`, `/seller/earnings`
- **Verification**: `/tickets/verify`, `/tickets/verify/result`
- **Checkout**: `/checkout/:listingId`, `/checkout/:listingId/payment`, `/checkout/:listingId/security-check`, `/checkout/:listingId/success`
- **Dispute**: `/disputes`, `/disputes/:disputeId`
- **Admin**: `/admin`, `/admin/bot-detection`, `/admin/resale-monitoring`, `/admin/listings`, `/admin/users`, `/admin/disputes`, `/admin/transactions`, `/admin/audit-logs`
- **Organizer**: `/organizer`, `/organizer/events`, `/organizer/tickets`, `/organizer/transfers`, `/organizer/api`

### Mobile Application Tabs
- **Home**: Upcoming events, security trust banner, quick action tiles.
- **Marketplace**: Verified resale listing search with VND prices.
- **My Tickets**: Mobile QR digital ticket viewer with TicketShield verification badge.
- **Orders**: Purchase history and escrow status tracking.
- **Profile**: Account management and security settings.

---

## 🔒 Security & Bot Detection Flow
- Session behavioral monitoring: Request velocity, mouse/touch entropy, device fingerprint hash.
- Bot decision state engine: `ALLOWED` (low risk), `THROTTLED` (security challenge required), `BLOCKED` (high risk bot automated traffic).
- Escrow protection holding payment until successful event entry confirmation.
