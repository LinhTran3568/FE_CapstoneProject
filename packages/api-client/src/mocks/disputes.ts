import { Dispute } from '@ticketshield/types';

export const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'dsp-501',
    disputeNumber: 'DSP-2026-00501',
    orderId: 'ord-8801',
    buyerId: 'usr-buyer-01',
    buyerName: 'Nguyễn Văn An',
    sellerId: 'usr-seller-01',
    sellerName: 'Trần Thị Bình',
    reason: 'INVALID_TICKET_AT_VENUE',
    description: 'Khi quẹt mã QR tại cổng B trung tâm hội nghị, máy báo vé đã được sử dụng 10 phút trước.',
    evidenceUrls: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'UNDER_REVIEW',
    createdAt: '2026-09-06T14:30:00Z',
  },
];
