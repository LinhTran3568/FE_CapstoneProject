# Capstone FE - Frontend Monorepo Framework

> **Clean Production-Ready Monorepo Architecture for Capstone Project**

---

## 🛡️ Overview

This repository provides a clean, modular Front-End framework setup using a modern monorepo architecture. All excess mock databases and bloated pages have been removed to ensure a clean codebase ready for custom feature development and backend API integration.

---

## 🏗️ Monorepo Architecture

```
FE_CapstoneProject/
├── apps/
│   ├── web/         # React 18 + Vite + Tailwind CSS Web App Framework
│   └── mobile/      # React Native + Expo + Expo Router Mobile App Framework
├── packages/
│   ├── types/       # Shared TypeScript domain models & interfaces
│   ├── validation/  # Zod validation schemas for forms
│   └── api-client/  # Clean REST API client abstraction layer
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

## 🔑 Application Routes & Layout Structure

### Web Application Routes (`apps/web`)
- `/` -> `HomePage` (Clean FE Framework Landing Shell)
- `/login` -> `LoginPage` (Clean Authentication Form)
- `/register` -> `RegisterPage` (Clean Registration Form)
- `/dashboard` -> `DashboardPage` (Protected User Dashboard Framework)

### Mobile Application Tabs (`apps/mobile`)
- `(tabs)/index` -> Home Mobile Screen Placeholder
- `(tabs)/marketplace` -> Marketplace Screen Placeholder
- `(tabs)/tickets` -> Tickets Screen Placeholder
- `(tabs)/orders` -> Orders Screen Placeholder
- `(tabs)/profile` -> Profile Screen Placeholder

