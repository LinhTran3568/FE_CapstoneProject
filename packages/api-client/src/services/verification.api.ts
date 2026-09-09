import { TicketVerification } from '@ticketshield/types';
import { VerifyTicketFormData } from '@ticketshield/validation';
import { delay } from './client';

export const verificationApi = {
  verifyTicket: async (data: VerifyTicketFormData): Promise<TicketVerification> => {
    await delay(1200);
    // Simulate verification check with Organizer system
    if (data.ticketCode.toUpperCase().includes('INVALID') || data.ticketCode.toUpperCase().includes('FAKE')) {
      return {
        id: `ver-${Date.now()}`,
        ticketId: 'tkt-unknown',
        verifierId: 'sys-verifier-ai',
        status: 'INVALID',
        rejectionReason: 'Mã vé không tồn tại trên hệ thống Ban tổ chức',
        verifiedBySystem: 'TicketShield Verified AI Engine 2.4',
      };
    }

    if (data.ticketCode.toUpperCase().includes('USED')) {
      return {
        id: `ver-${Date.now()}`,
        ticketId: 'tkt-used',
        verifierId: 'sys-verifier-ai',
        status: 'ALREADY_USED',
        rejectionReason: 'Mã vé này đã được sử dụng check-in tại sự kiện',
        verifiedBySystem: 'TicketShield Verified AI Engine 2.4',
      };
    }

    return {
      id: `ver-${Date.now()}`,
      ticketId: `tkt-${data.ticketCode}`,
      verifierId: 'sys-verifier-ai',
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      organizerSignature: 'sig-sha256-organizer-verified-stamp-vn',
      verifiedBySystem: 'TicketShield Verified AI Engine 2.4',
    };
  },
};
