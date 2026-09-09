# TicketShield AI Architecture Overview

## Executive Summary
TicketShield AI is an AI-driven bot detection and verified peer-to-peer event ticket resale platform for Vietnam. It solves primary ticket scalping/bot buying, verified ticket resale, escrow payment protection, venue check-in verification, and admin monitoring.

## System Architecture Diagram
```
+-----------------------------------------------------------------------+
|                           CLIENT LAYER                                |
|  +-----------------------------------+  +--------------------------+  |
|  |     React + Vite Web App          |  |  React Native Expo App   |  |
|  | (Buyer, Reseller, Admin, Org)     |  | (Buyer & Ticket Holder)  |  |
|  +-----------------------------------+  +--------------------------+  |
+-----------------------------------||----------------------------------+
                                    || HTTPS / REST API
+-----------------------------------\/----------------------------------+
|                       SPRING BOOT BACKEND API                         |
|  +----------------+  +-----------------+  +------------------------+  |
|  | Auth Service   |  | Ticket Service  |  | Marketplace Service    |  |
|  +----------------+  +-----------------+  +------------------------+  |
|  +----------------+  +-----------------+  +------------------------+  |
|  | Escrow Engine  |  | Dispute Engine  |  | AI Bot Detection Svc   |  |
|  +----------------+  +-----------------+  +------------------------+  |
+-----------------------------------||----------------------------------+
                                    || SQL / Persistent Storage
+-----------------------------------\/----------------------------------+
|                            POSTGRESQL DATABASE                        |
+-----------------------------------------------------------------------+
```

## Security & Bot Detection Flow
1. **Behavior Profiling**: Keypress dynamics, mouse movement entropy, request velocity per minute, and device fingerprint hash are recorded.
2. **AI Classification**: `botDetectionService.assessSession()` yields a risk score (0.00 - 1.00) and decision (`ALLOWED`, `THROTTLED`, `BLOCKED`).
3. **Escrow Safeguard**: Resale funds are held in Escrow until the buyer confirms venue entry or the auto-release timer expires.
