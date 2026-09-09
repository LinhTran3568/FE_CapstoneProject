# TicketShield AI Frontend Guidelines

## Design System Tokens
- **Navy Foundation**: `#0b0f19` (background), `#161e2e` (surface card), `#1e293b` (border)
- **Cyan Accent**: `#06b6d4` / `#0ea5e9` (primary trust action)
- **Emerald Verified**: `#10b981` (TicketShield verified status)
- **Crimson Risk**: `#ef4444` (bot block / dispute high risk)
- **Amber Warning**: `#f59e0b` (throttled session / pending verification)

## Coding Conventions
1. **Strict TypeScript**: No `any`. Explicit return types for services and hooks.
2. **Thin Page Components**: Pages extract parameters, invoke custom React Query hooks, and render presentation components.
3. **Data Formatting**: Use `formatVND(amount)` for currency and `formatVietnameseDate(isoDate)` for dates.
