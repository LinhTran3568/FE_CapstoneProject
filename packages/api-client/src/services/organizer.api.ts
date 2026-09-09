import { Organizer } from '@ticketshield/types';
import { MOCK_USERS } from '../mocks/users';
import { delay } from './client';

export interface WebhookLog {
  id: string;
  eventType: 'TICKET_VERIFIED' | 'OWNERSHIP_TRANSFERRED' | 'DISPUTE_OPENED';
  payload: string;
  responseCode: number;
  timestamp: string;
}

export const organizerApi = {
  getProfile: async (): Promise<Organizer> => {
    await delay();
    return {
      id: 'org-001',
      name: 'Ban Tổ Chức CT Wave Entertainment',
      companyName: 'Công ty Cổ phần Truyền thông Wave Việt Nam',
      taxCode: '01099887766',
      email: 'partner@ctwave.vn',
      phone: '02839998888',
      verifiedEventsCount: 12,
      apiKey: 'ts_live_pk_994810294810294',
      webhookUrl: 'https://api.ctwave.vn/webhooks/ticketshield',
      status: 'ACTIVE',
    };
  },

  getWebhookLogs: async (): Promise<WebhookLog[]> => {
    await delay();
    return [
      {
        id: 'wh-101',
        eventType: 'OWNERSHIP_TRANSFERRED',
        payload: '{"ticketId":"tkt-102","newOwnerId":"usr-buyer-01"}',
        responseCode: 200,
        timestamp: '2026-09-08T16:20:00Z',
      },
      {
        id: 'wh-102',
        eventType: 'TICKET_VERIFIED',
        payload: '{"ticketId":"tkt-101","status":"VERIFIED"}',
        responseCode: 200,
        timestamp: '2026-09-08T15:10:00Z',
      },
    ];
  },

  regenerateApiKey: async (): Promise<{ apiKey: string }> => {
    await delay(400);
    return { apiKey: `ts_live_pk_${Date.now()}` };
  },
};
