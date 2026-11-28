# SCRUM-89 Payment Status Poll — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After buyer hold, FE polls payment status until SePay lock succeeds, then auto-closes the QR modal and sends the buyer to `/my-tickets`. Fake "Tôi đã chuyển khoản" success is removed.

**Architecture:** No new BE. Core already has `GET /api/v1/resale-listings/{id}/payment-status` (JWT, buyer of that escrow only). FE adds a typed client + react-query poll (`refetchInterval` 3s) inside `BuyTicketModal` after `holdData` is set. No SignalR — none exists in either repo this week.

**Tech Stack:** React 18, TypeScript, TanStack Query (already wrapped in `App.tsx`), existing `resaleListingsApi` + `BuyTicketModal` + `MarketplacePage`.

**Spec:** [SCRUM-89](https://ticketshield-task.atlassian.net/browse/SCRUM-89) — Polling/Realtime listener lắng nghe trạng thái thanh toán thành công để tự động chuyển hướng Buyer sang trang thông báo thành công.

**Parent:** SCRUM-85 (US-3.2 buyer payment UI). Depends on Linh SCRUM-83 (hold + QR) — already merged on `flow/MF_02`.

## Global Constraints

- FE repo `FE_CapstoneProject`. Create `feature/SCRUM-89-payment-poll` from **`origin/flow/MF_02`** (same integration branch as 97). PR target: `flow/MF_02`.
- Poll only. Do not add SignalR / WebSocket.
- Success = Core JSON `listingStatus === "Sold"` **or** `escrowStatus === "Locked"`. Check `RefundQueued` first so a refund never looks like paid.
- `"Tôi đã chuyển khoản"` must **not** call `onSuccess`. Poll is the only success path.
- Do not touch 96 (My Tickets mock), 98 (dropdown), 97 (seller SOLD notice), coupon SAYHI, mock-tickets, TransferOwnership.
- `apps/web` has no vitest — verify with typecheck + browser hold + webhook. Do not invent a test runner.
- No emoji in UI or copy.
- BE for browser test is `flow/MF_03` (Gateway `:5000` → Core `:5003`). FE talks to Gateway, not Core directly.

## Locked design

| Topic | Decision |
|-------|----------|
| Interval | 3 seconds while hold is active |
| Stop poll | modal closed, local 10-min expiry, Sold/Locked (success), RefundQueued (fail) |
| Success UI | existing `onSuccess` toast + `navigate('/my-tickets')`. There is no dedicated success page. `/my-tickets` is still mock until 96 — that is OK for this ticket. |
| Fail UI | toast error, treat as expired, keep modal (user can close). Do not fake sold. |
| Button | keep visible; click = info toast that bank confirm is still pending |
| Types | new `PaymentStatusDto` with **strings** matching Core `ToString()` (`Pending`, `Locked`, `RefundQueued`, `Transacting`, `Sold`). Do **not** reuse FE `EscrowStatus` (`PENDING`/`FUNDED`/…) — that union is wrong vs Core and unused by this API. |
| Auth | same JWT interceptor as hold. 403/404 → stop poll + error toast. |

Core DTO (camelCase JSON):

```
listingId, escrowId, listingStatus, escrowStatus, paymentReference, unlockAt, inSettlementBuffer
```

Success after webhook: `listingStatus=Sold`, `escrowStatus=Locked`.
Refund queue (SCRUM-119): `escrowStatus=RefundQueued` — not success.

---

### Task 1: Types + API client

**Files:**
- Modify: `packages/types/src/index.ts` (after `HoldListingForPurchaseResponse`)
- Modify: `packages/api-client/src/services/resaleListings.api.ts`

**Step 1: Add DTO**

```ts
/** GET /api/v1/resale-listings/{id}/payment-status → backend GetPaymentStatusDto */
export interface PaymentStatusDto {
  listingId: string;
  escrowId: string;
  listingStatus: string;
  escrowStatus: string;
  paymentReference: string;
  unlockAt: string | null;
  inSettlementBuffer: boolean;
}
```

**Step 2: Add client method** (next to `holdListing`)

```ts
getPaymentStatus: async (listingId: string): Promise<PaymentStatusDto> => {
  return httpClient<PaymentStatusDto>(
    `/resale-listings/${encodeURIComponent(listingId)}/payment-status`,
    { method: 'GET' }
  );
},
```

Export `PaymentStatusDto` from the api-client file the same way `HoldListingForPurchaseResponse` is re-exported.

- [ ] Typecheck packages if needed: `npm run typecheck --workspace=packages/types` (or the workspace typecheck that already covers types).
- [ ] Commit: `feat(api): add payment-status client for SCRUM-89`

---

### Task 2: Poll hook + BuyTicketModal

**Files:**
- Create: `apps/web/src/hooks/usePaymentStatus.ts` (mirror `useMarketplaceListings.ts`)
- Modify: `apps/web/src/components/marketplace/BuyTicketModal.tsx`

**Hook**

```ts
export const paymentStatusQueryKey = (listingId: string) =>
  ['resale-listings', 'payment-status', listingId] as const;

export const usePaymentStatus = (listingId: string | undefined, enabled: boolean) =>
  useQuery<PaymentStatusDto>({
    queryKey: paymentStatusQueryKey(listingId || ''),
    queryFn: () => resaleListingsApi.getPaymentStatus(listingId!),
    enabled: Boolean(listingId) && enabled,
    refetchInterval: 3_000,
    staleTime: 0,
  });
```

`enabled` from modal: `isOpen && !!holdData && !isExpired && !paidHandled`.

**Modal wiring**

1. Call hook with `listing.listingId` and the `enabled` flag above.
2. `useEffect` on `data`:
   - if `escrowStatus === 'RefundQueued'` → `showToast` (payment not accepted / refund queued), `setIsExpired(true)`, return
   - else if `listingStatus === 'Sold' || escrowStatus === 'Locked'` → call `onSuccess` **once** (ref `paidHandled`) with the same order payload shape as today (`orderId` = `paymentReference`)
3. On query `isError` while enabled: toast the error once; do not loop forever if 403/404 (set expired / disable enabled).
4. Replace `handleConfirmPaid` body:

```ts
showToast('Hệ thống đang chờ ngân hàng xác nhận. Giữ nguyên màn hình này.', 'info');
```

Keep the button label `Tôi đã chuyển khoản` (user still needs a control). Disable it when `isExpired`.

5. Near the countdown, show a short line while polling: `Đang chờ xác nhận thanh toán...` (plain text, no emoji).

6. Early `return null` currently sits **before** hooks (`if (!isOpen || !listing) return null` at line 36). Adding `useQuery` below that violates rules of hooks. **Move the early return below all hooks**, or keep the modal mounted and gate the query with `enabled` only. Prefer: keep hooks always called; `enabled` is false when `!isOpen || !listing`. Do not add a hook after a conditional return.

- [ ] Typecheck: `npm run typecheck --workspace=apps/web` from `FE_CapstoneProject`. Expected: pass.
- [ ] Commit: `feat(marketplace): poll payment-status until escrow locks`

---

### Task 3: Auto-redirect after success

**Files:**
- Modify: `apps/web/src/pages/MarketplacePage.tsx` (`onSuccess` ~421)

`MarketplacePage` already imports `useNavigate`.

```ts
onSuccess={(orderData) => {
  setBuyingListing(null);
  showToast(
    `Đặt vé thành công! Mã đơn: ${orderData.orderId}. Vui lòng kiểm tra email và danh sách Vé Của Tôi.`,
    'success'
  );
  navigate('/my-tickets');
}}
```

Do not build a new success page. `/my-tickets` is the buyer destination named in the toast; 96 will fill real tickets later.

- [ ] Commit: `feat(marketplace): redirect buyer to my-tickets after payment lock`

---

### Task 4: Browser verify (required — 97 taught us not to skip)

Need: FE `apps/web` + Gateway `:5000` + Identity `:5002` + Core `:5003`. Webhook same as BE 88/119 (`Authorization: Apikey TicketShieldWebhookKey2026`).

1. Login buyer (seed user with JWT).
2. Marketplace → hold a `Verified` listing → QR + `TS…` reference shows.
3. **Do not click through to success.** Confirm Network: `GET .../payment-status` every ~3s, body `listingStatus=Transacting`, `escrowStatus=Pending`.
4. Click `Tôi đã chuyển khoản` → toast "đang chờ ngân hàng", modal **stays**, no `/my-tickets` yet.
5. POST SePay webhook with that `content` / `transferAmount` matching hold (same as BE lock test).
6. Next poll: `Sold` + `Locked` → modal closes, success toast, URL is `/my-tickets`.
7. Negative: either wait 10 min **or** trigger refund-queued path if a test listing exists — poll must **not** navigate. Expired hold: poll stops.
8. Mobile ~375px: QR + waiting line still usable, no horizontal overflow.

If APIs are down, **stop and report** — do not mark the ticket tested.

---

### Out of scope (do not do)

- SignalR hub
- SCRUM-96 My Tickets real data / mock-tickets proxy
- SCRUM-98 ticket dropdown
- Coupon SAYHI
- Changing Core `GetPaymentStatusDto` or webhook
- Fixing unused FE `EscrowStatus` union (`PENDING`/`FUNDED`)

---

## Execution

Plan only until the user picks:

1. **Subagent-Driven** (recommended) — one subagent per task, review between tasks
2. **Inline** — this session implements the tasks in order
