import { BotSession, SuspiciousListing, AdminMetric, AuditLog } from '@ticketshield/types';

export const MOCK_BOT_SESSIONS: BotSession[] = [
  {
    id: 'bot-sess-901',
    userId: 'usr-guest-99',
    ipAddress: '113.161.42.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeadlessChrome/122.0.0.0',
    deviceFingerprint: 'fp-chrome-headless-vn-8890',
    country: 'Vietnam (Hanoi)',
    riskScore: 0.94,
    decision: 'BLOCKED',
    requestsPerMinute: 420,
    isBotPatternDetected: true,
    timestamp: '2026-09-08T17:45:00Z',
    status: 'TERMINATED',
  },
  {
    id: 'bot-sess-902',
    userId: 'usr-guest-45',
    ipAddress: '27.72.101.55',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    deviceFingerprint: 'fp-mac-safari-vn-1209',
    country: 'Vietnam (Hồ Chí Minh)',
    riskScore: 0.58,
    decision: 'THROTTLED',
    requestsPerMinute: 85,
    isBotPatternDetected: true,
    timestamp: '2026-09-08T18:02:00Z',
    status: 'CHALLENGED',
  },
  {
    id: 'bot-sess-903',
    userId: 'usr-buyer-01',
    ipAddress: '14.225.20.88',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    deviceFingerprint: 'fp-ios-safari-vn-5541',
    country: 'Vietnam (Hà Nội)',
    riskScore: 0.12,
    decision: 'ALLOWED',
    requestsPerMinute: 12,
    isBotPatternDetected: false,
    timestamp: '2026-09-08T18:10:00Z',
    status: 'ACTIVE',
  },
];

export const MOCK_SUSPICIOUS_LISTINGS: SuspiciousListing[] = [
  {
    id: 'susp-101',
    listingId: 'lst-303',
    ticketId: 'tkt-999',
    sellerId: 'usr-suspicious-09',
    sellerName: 'Lê Văn Scalper',
    eventTitle: 'Anh Trai Vượt Ngàn Chông Gai - Concert 3 (Hà Nội)',
    priceDeltaPercentage: 239.2,
    flagReason: 'Giá rao bán vượt 200% so với giá niêm yết ban đầu (Scalping)',
    riskScore: 0.88,
    status: 'FLAGGED',
    flaggedAt: '2026-09-06T09:05:00Z',
  },
];

export const MOCK_ADMIN_METRICS: AdminMetric = {
  totalTransactions: 1420,
  verifiedTicketsCount: 3890,
  activeListingsCount: 420,
  suspiciousListingsCount: 18,
  botSessionsCount: 15400,
  allowedSessionsCount: 13800,
  throttledSessionsCount: 1100,
  blockedSessionsCount: 500,
  detectionAccuracy: 99.4,
  falsePositiveRate: 0.3,
  openDisputesCount: 4,
  totalEscrowVolumeVnd: 4850000000,
};

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1001',
    actorId: 'usr-admin-01',
    actorName: 'Lê Minh Tuấn (Admin)',
    actorRole: 'ADMIN',
    action: 'FLAG_LISTING',
    targetEntity: 'TicketListing',
    targetId: 'lst-303',
    details: 'Đã đánh dấu nghi vấn vé phe vé cho người bán Lê Văn Scalper',
    ipAddress: '118.70.12.90',
    timestamp: '2026-09-06T09:10:00Z',
  },
];
