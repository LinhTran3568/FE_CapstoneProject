import {
  AdminMetric,
  BotSession,
  SuspiciousListing,
  Dispute,
  Transaction,
  AuditLog,
} from '@ticketshield/types';
import {
  MOCK_ADMIN_METRICS,
  MOCK_BOT_SESSIONS,
  MOCK_SUSPICIOUS_LISTINGS,
  MOCK_AUDIT_LOGS,
} from '../mocks/dashboard';
import { MOCK_DISPUTES } from '../mocks/disputes';
import { delay } from './client';

export const adminApi = {
  getMetrics: async (): Promise<AdminMetric> => {
    await delay();
    return MOCK_ADMIN_METRICS;
  },

  getBotSessions: async (): Promise<BotSession[]> => {
    await delay();
    return MOCK_BOT_SESSIONS;
  },

  getSuspiciousListings: async (): Promise<SuspiciousListing[]> => {
    await delay();
    return MOCK_SUSPICIOUS_LISTINGS;
  },

  getDisputes: async (): Promise<Dispute[]> => {
    await delay();
    return MOCK_DISPUTES;
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    await delay();
    return MOCK_AUDIT_LOGS;
  },

  reviewListing: async (listingId: string, action: string, reason: string): Promise<void> => {
    await delay(500);
  },

  resolveDispute: async (disputeId: string, resolution: 'RESOLVED_BUYER' | 'RESOLVED_SELLER', notes: string): Promise<void> => {
    await delay(600);
    const d = MOCK_DISPUTES.find((item) => item.id === disputeId);
    if (d) {
      d.status = resolution;
      d.adminResolutionNotes = notes;
      d.resolvedAt = new Date().toISOString();
    }
  },
};
