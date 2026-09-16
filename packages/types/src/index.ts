// TicketShield AI Domain Models & Types

export type UserRole = 'BUYER' | 'RESELLER' | 'ADMIN' | 'ORGANIZER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string;
  role: UserRole;
  isVerified: boolean;
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  reputationScore?: number;
  completedSalesCount?: number;
}

export type TicketStatus =
  | 'VALID'
  | 'USED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'TRANSFERRED'
  | 'PENDING_VERIFICATION';

/**
 * Resale listing lifecycle.
 * Mirrors the backend enum `TicketShield.Domain.Enums.ListingStatus`,
 * which the API serializes by name (e.g. "Verified").
 * - Verified    → listed and open for buyers
 * - Transacting → a buyer has paid into escrow
 * - Sold        → ownership transferred, escrow released
 * - Cancelled   → seller cancelled, original ticket unlocked at the organizer
 */
export type ListingStatus =
  | 'Draft'
  | 'Verified'
  | 'Transacting'
  | 'Sold'
  | 'Cancelled';

/** Mirrors the backend enum `TicketShield.Domain.Enums.VerificationStatus`. */
export type VerificationStatus =
  | 'PendingOtp'
  | 'Verified'
  | 'Rejected';

export interface TrendingEventDto {
  id?: string;
  eventId?: string;
  name: string;
  artist?: string;
  category?: string;
  city?: string;
  bannerUrl?: string;
  venue: string;
  description?: string;
  eventStartAt: string;
  eventEndAt?: string;
  minResalePrice?: number;
  originalPriceFrom?: number;
  totalAvailableListings: number;
  organizerName?: string;
}

export type MarketplaceListingDto = ResaleListingDetailDto;


export type EscrowStatus =
  | 'PENDING'
  | 'FUNDED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'DISPUTED';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_BUYER'
  | 'RESOLVED_SELLER'
  | 'CLOSED';

export type BotDecision = 'ALLOWED' | 'THROTTLED' | 'BLOCKED';

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'CONCERT' | 'FESTIVAL' | 'SPORTS' | 'THEATER' | 'EXHIBITION';
  bannerImage: string;
  thumbnailImage: string;
  venue: Venue;
  startDate: string;
  endDate: string;
  organizerId: string;
  organizerName: string;
  minPrice: number;
  maxPrice: number;
  isHighDemand: boolean;
  status: 'UPCOMING' | 'ON_SALE' | 'SOLD_OUT' | 'POSTPONED' | 'CANCELLED' | 'COMPLETED';
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  zone: string;
  price: number;
  currency: string;
  totalQuantity: number;
  remainingQuantity: number;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  ticketTypeId: string;
  ticketTypeName: string;
  seatZone: string;
  seatRow?: string;
  seatNumber?: string;
  originalPrice: number;
  ownerId: string;
  ownerName: string;
  status: TicketStatus;
  qrCodeHash: string;
  issuedAt: string;
}

export interface TicketVerification {
  id: string;
  ticketId: string;
  verifierId: string;
  status: 'VERIFYING' | 'VERIFIED' | 'INVALID' | 'ALREADY_USED' | 'OWNERSHIP_MISMATCH' | 'TRANSFER_REQUIRED';
  verifiedAt?: string;
  organizerSignature?: string;
  rejectionReason?: string;
  verifiedBySystem: string;
}

export interface TicketListing {
  id: string;
  ticketId: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  sellerTotalSales: number;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  bannerImage: string;
  venueName: string;
  seatZone: string;
  seatInfo: string;
  faceValue: number;
  resalePrice: number;
  status: ListingStatus;
  verificationId: string;
  verificationBadgeUrl?: string;
  createdAt: string;
  escrowProtection: boolean;
}

/**
 * One row of the seller's own listings.
 * GET /api/v1/resale-listings/my-listings → backend `SellerListingDto`.
 */
export interface SellerListingDto {
  listingId: string;
  eventId: string;
  eventName: string;
  eventVenue: string;
  /** ISO 8601 date-time with offset */
  eventStartAt: string;
  tierId: string;
  tierName: string;
  originalTicketCode: string;
  /** VND */
  originalPrice: number;
  /** VND, never above the event price ceiling */
  resalePrice: number;
  discountAmount: number;
  discountPercentage: number;
  isPrivate: boolean;
  /** Secret share token; only present when isPrivate is true */
  privateAccessToken: string | null;
  /** Backend-generated link (production domain); the web app builds its own link from the token */
  shareUrl: string | null;
  verificationStatus: VerificationStatus;
  listingStatus: ListingStatus;
  createdAt: string;
}

/**
 * Generic paginated response from backend `TicketShield.Application.Common.Models.PaginatedList<T>`.
 */
export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Public marketplace resale listing.
 * GET /api/v1/resale-listings → backend `ResaleListingDetailDto`.
 */
export interface ResaleListingDetailDto {
  listingId: string;
  eventId: string;
  eventName: string;
  eventVenue: string;
  eventStartAt: string;
  tierId: string;
  tierName: string;
  originalPrice: number;
  resalePrice: number;
  discountAmount: number;
  discountPercentage: number;
  isPrivate: boolean;
  maskedTicketCode: string;
  verificationStatus: VerificationStatus;
  listingStatus: ListingStatus;
  sellerId: string;
  sellerFullName: string;
  createdAt: string;
}

/** POST /api/v1/resale-listings/{id}/cancel → backend `CancelResaleListingResponse`. */
export interface CancelResaleListingResponse {
  listingId: string;
  originalTicketCode: string;
  listingStatus: ListingStatus;
  cancelledAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  listingId?: string;
  eventId: string;
  eventTitle: string;
  ticketQuantity: number;
  unitPrice: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  escrowId?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: 'MOMO' | 'VNPAY' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transactionReference: string;
  paidAt?: string;
}

export interface Escrow {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: EscrowStatus;
  fundedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  disputeId?: string;
  autoReleaseAt: string;
}

export interface Transaction {
  id: string;
  type: 'TICKET_PURCHASE' | 'ESCROW_FUNDING' | 'ESCROW_RELEASE' | 'ESCROW_REFUND' | 'PLATFORM_FEE';
  amount: number;
  currency: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  referenceId: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  timestamp: string;
}

export interface OwnershipTransfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  toUserId: string;
  orderId: string;
  transferredAt: string;
  organizerConfirmationId: string;
  newQrCodeHash: string;
}

export interface BotRiskAssessment {
  score: number; // 0.00 to 1.00
  factors: {
    requestVelocity: number;
    mouseMovementEntropy?: number;
    typingPatternEntropy?: number;
    sessionAgeSeconds: number;
    ipReputation: 'CLEAN' | 'DATACENTER' | 'TOR' | 'HIGH_RISK_PROXY';
    deviceFingerprintHash: string;
  };
  decision: BotDecision;
  challengeRequired?: boolean;
}

export interface BotSession {
  id: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  country: string;
  riskScore: number;
  decision: BotDecision;
  requestsPerMinute: number;
  isBotPatternDetected: boolean;
  timestamp: string;
  status: 'ACTIVE' | 'TERMINATED' | 'CHALLENGED';
}

export interface Dispute {
  id: string;
  disputeNumber: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  reason: 'INVALID_TICKET_AT_VENUE' | 'ALREADY_SCANNED' | 'SEAT_MISMATCH' | 'TRANSFER_FAILED' | 'OTHER';
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  createdAt: string;
  resolvedAt?: string;
  adminResolutionNotes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER_UPDATE' | 'VERIFICATION_COMPLETE' | 'ESCROW_RELEASED' | 'SECURITY_ALERT' | 'DISPUTE_UPDATE';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AdminMetric {
  totalTransactions: number;
  verifiedTicketsCount: number;
  activeListingsCount: number;
  suspiciousListingsCount: number;
  botSessionsCount: number;
  allowedSessionsCount: number;
  throttledSessionsCount: number;
  blockedSessionsCount: number;
  detectionAccuracy: number;
  falsePositiveRate: number;
  openDisputesCount: number;
  totalEscrowVolumeVnd: number;
}

export interface SuspiciousListing {
  id: string;
  listingId: string;
  ticketId: string;
  sellerId: string;
  sellerName: string;
  eventTitle: string;
  priceDeltaPercentage: number; // e.g. +300% face value
  flagReason: string;
  riskScore: number;
  status: 'NEEDS_REVIEW' | 'FLAGGED' | 'SUSPENDED' | 'CLEARED';
  flaggedAt: string;
}

export interface Organizer {
  id: string;
  name: string;
  companyName: string;
  taxCode: string;
  email: string;
  phone: string;
  verifiedEventsCount: number;
  apiKey: string;
  webhookUrl: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetEntity: string;
  targetId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}
