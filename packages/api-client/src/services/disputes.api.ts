import { Dispute } from '@ticketshield/types';
import { CreateDisputeFormData } from '@ticketshield/validation';
import { MOCK_DISPUTES } from '../mocks/disputes';
import { delay } from './client';

export const disputesApi = {
  createDispute: async (data: CreateDisputeFormData): Promise<Dispute> => {
    await delay(700);
    const newDispute: Dispute = {
      id: `dsp-${Date.now()}`,
      disputeNumber: `DSP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      orderId: data.orderId,
      buyerId: 'usr-buyer-01',
      buyerName: 'Nguyễn Văn An',
      sellerId: 'usr-seller-01',
      sellerName: 'Trần Thị Bình',
      reason: data.reason,
      description: data.description,
      evidenceUrls: data.evidenceUrls || [
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
      ],
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    MOCK_DISPUTES.unshift(newDispute);
    return newDispute;
  },

  getDisputes: async (): Promise<Dispute[]> => {
    await delay();
    return MOCK_DISPUTES;
  },

  getById: async (id: string): Promise<Dispute> => {
    await delay();
    const dispute = MOCK_DISPUTES.find((d) => d.id === id || d.disputeNumber === id);
    if (!dispute) throw new Error('Không tìm thấy khiếu nại');
    return dispute;
  },
};
