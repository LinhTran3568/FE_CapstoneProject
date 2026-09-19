# SCRUM-96 Buyer My Tickets — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/my-tickets` lists the signed-in buyer's tickets from Linh's MockOrganizer API and shows an entry QR — not the two hardcoded concert cards.

**Architecture:** Jira US-3.3 already shipped `GET /api/v1/mock-tickets/my-tickets` on MockOrganizer `:5001` ([SCRUM-93](https://ticketshield-task.atlassian.net/browse/SCRUM-93), Linh, Done). 96 is **FE only**: call that API with the logged-in email, replace mock cards, draw QR from `ticketCode`. Do **not** add Core `GET my-purchases`.

Gateway YARP (`:5000`) has no MockOrganizer cluster. `/api/v1/**` goes to Core `:5003`, so `http://localhost:5000/api/v1/mock-tickets/my-tickets` **404**. FE must hit `:5001` directly — same pattern as `OrganizerPortalPage` (`http://localhost:5001/api/organizer`). MockOrganizer CORS is `AllowAnyOrigin`.

**Tech Stack:** React 18, TanStack Query, `qrcode.react` (already in `apps/web`).

**Spec:** [SCRUM-96](https://ticketshield-task.atlassian.net/browse/SCRUM-96) — Trang danh sách vé đã mua thành công, hiển thị chi tiết sự kiện, thông tin chỗ ngồi, mã vé mới và mã QR vào cổng.

**Parent:** [SCRUM-95](https://ticketshield-task.atlassian.net/browse/SCRUM-95). Sibling 97 merged. Sibling 98 **out of scope**.

## Global Constraints

- FE: branch `feature/SCRUM-96-my-tickets` from **`origin/flow/MF_02`**. PR target: `flow/MF_02`.
- **No TicketShield PR.** Do not add Core endpoints, Gateway routes, or TransferOwnership.
- Call `http://localhost:5001/api/v1/mock-tickets/my-tickets?email={loggedInEmail}` (override with `VITE_ORGANIZER_API_BASE_URL` if set).
- Never send another user's email. Use `useAuthStore` email only.
- Do not touch 89 poll, 97 My Listings, 98 dropdown, coupon SAYHI.
- `apps/web` has no vitest — verify = typecheck + browser.
- No emoji in UI.

## Locked design

| Topic | Decision |
|-------|----------|
| Endpoint | Linh [SCRUM-93](https://ticketshield-task.atlassian.net/browse/SCRUM-93): `GET /api/v1/mock-tickets/my-tickets?email=` on MockOrganizer |
| Auth | Buyer JWT already on FE; pass **that user's email** as query. API itself has no JWT (Linh contract). |
| Filter | Prefer `status=VALID`. Do not show `LOCKED_FOR_RESALE` / `TRANSFERRED` / `CANCELLED` as an entry pass. |
| QR | Modal on **Show Entry QR Code**; `QRCodeCanvas` value = `ticketCode`. Stop toast `"Displaying verified QR..."`. |
| Empty | Vietnamese: chưa có vé; CTA `/marketplace`. |
| Loading / error | Match Marketplace (spinner + message). Include "MockOrganizer chưa chạy (:5001)" when fetch fails. |
| PRs | One FE PR into `flow/MF_02`. |

Linh JSON:

```
{ success, count, data: [{ id, ticketCode, eventName, seatZone, originalPrice, ownerEmail, ownerPhone, ownerName, status, createdAt, updatedAt }] }
```

Map to cards: `eventName`, `seatZone` (chỗ ngồi), `ticketCode` (mã vé / QR). Venue + event start are **not** on this DTO — do not fake them from Core.

---

### Task 1: Types + API client

**Repo:** `FE_CapstoneProject`.

**Files:**
- Modify: `packages/types/src/index.ts`
- Create or modify: `packages/api-client/src/services/mockTickets.api.ts` (new file preferred; do not stuff this into `resaleListings.api.ts` which uses Gateway `:5000`)
- Modify: `packages/api-client/src/index.ts` to export

```ts
export interface MockTicketDto {
  id: string;
  ticketCode: string;
  eventName: string;
  seatZone: string;
  originalPrice: number;
  ownerEmail: string;
  ownerPhone?: string | null;
  ownerName?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockTicketsListResponse {
  success: boolean;
  count: number;
  data: MockTicketDto[];
}
```

Organizer base URL: `import.meta.env.VITE_ORGANIZER_API_BASE_URL` or `http://localhost:5001/api/v1`.

`getMyTickets(email: string)` → GET `{base}/mock-tickets/my-tickets?email={encodeURIComponent(email)}&status=VALID` → return `data` array.

Do **not** use `httpClient` / Gateway JWT for this call (that client is `:5000/api/v1`). Plain `fetch` is fine (Organizer portal already does this).

- [ ] **Step 1:** Add types + client.
- [ ] **Step 2:** `npm run typecheck --workspace=apps/web`
- [ ] **Step 3:** Commit: `feat(api): call Linh mock-tickets my-tickets for SCRUM-96`

---

### Task 2: Hook + MyTicketsPage

**Files:**
- Create: `apps/web/src/hooks/useMyTickets.ts`
- Modify: `apps/web/src/pages/MyTicketsPage.tsx`

**Hook:** `useQuery` key `['mock-tickets', 'my-tickets', email]`, enabled when authenticated **and** email is non-empty. `queryFn` calls `getMyTickets(email)`.

**Page:**
1. Delete hardcoded Coldplay / Anh Trai Vượt Ngàn array.
2. Loading / error / empty as above.
3. Each `MockTicketDto` → existing card: eventName, seatZone as seat line, ticketCode as mono code.
4. **Show Entry QR Code** opens modal: `QRCodeCanvas` `value={ticket.ticketCode}` + code as text. Close backdrop / X.
5. Keep page chrome. Unused `Download` / `Share2`: do not add those features.

- [ ] Typecheck: `npm run typecheck --workspace=apps/web`
- [ ] Commit: `feat(tickets): render Linh my-tickets and entry QR (SCRUM-96)`

---

### Task 3: Browser verify (required)

Need: FE `:3000`, MockOrganizer `:5001` (US-3.3 on `flow/MF_03`), plus Gateway/Identity/Core if testing after a real buy.

1. Login buyer → `/my-tickets` with MockOrganizer down: error, **no** Coldplay mock.
2. Seed/API: a `VALID` ticket whose `ownerEmail` = buyer email → card + QR modal (not toast-only).
3. Ticket owned by another email → must not appear.
4. `LOCKED_FOR_RESALE` / `TRANSFERRED` → must not appear as an entry pass.
5. Seller login: empty unless they own VALID tickets.
6. Mobile ~375px: cards stack, QR modal fits, no horizontal overflow.

**If list is empty after a real SePay lock:** check whether Core webhook actually called `TransferOwnership` (Linh 94 exists as gRPC client; webhook US-3.2 may not invoke it). That is **not** a 96 bug and is **not** a reason to add Core `my-purchases`. Report it; page still must consume 93.

---

### Out of scope (do not do)

- Core `GET /resale-listings/my-purchases`
- Gateway YARP route to `:5001` (nice-to-have, not this ticket)
- Calling TransferOwnership / changing webhook
- SCRUM-98 dropdown
- Rewriting My Tickets visual theme

---

## Execution

Plan only until the user picks:

1. **Subagent-Driven** (recommended)
2. **Inline** — this session implements FE against Linh 93
