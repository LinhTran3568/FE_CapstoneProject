# TicketShield AI Development Guide

## Setup Instructions

1. **Install Dependencies**:
```bash
npm install
# or
pnpm install
```

2. **Run Web Application**:
```bash
npm run dev:web
```

3. **Run Mobile Application**:
```bash
npm run dev:mobile
```

4. **Typecheck Codebase**:
```bash
npm run typecheck
```

5. **Replacing Mock API with Real Spring Boot Backend**:
Update `VITE_API_BASE_URL` in `apps/web/.env` and `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env`. The service methods inside `@ticketshield/api-client` conform 1-to-1 with the backend DTO contracts.
