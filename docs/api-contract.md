# TicketShield AI REST API Contract (Spring Boot Integration)

## Authentication Endpoints
- `POST /api/v1/auth/login` -> `{ email, password }` -> returns `{ user, token, refreshToken }`
- `POST /api/v1/auth/register` -> `{ fullName, email, phoneNumber, password, role }`

## Marketplace & Resale Endpoints
- `GET /api/v1/listings?eventId={id}&verifiedOnly=true` -> returns `TicketListing[]`
- `POST /api/v1/listings` -> `{ ticketId, resalePrice, seatInfo }` -> returns `TicketListing`

## Verification Endpoints
- `POST /api/v1/tickets/verify` -> `{ ticketCode, eventId, idCardNumber }` -> returns `TicketVerification`

## Bot Detection API
- `POST /api/v1/bot-detection/assess` -> `{ sessionToken, fingerprint }` -> returns `{ score, decision: "ALLOWED"|"THROTTLED"|"BLOCKED" }`

## Escrow & Orders
- `POST /api/v1/orders/checkout` -> returns `Order`
- `POST /api/v1/escrow/{id}/confirm-entry` -> releases funds to seller
