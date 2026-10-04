import React from 'react';
import type { MyPayoutDto, SellerListingDto } from '@ticketshield/types';
import { RevenueTab } from '../components/seller/RevenueTab';

const hours = (value: number) => new Date(Date.now() + value * 60 * 60 * 1000).toISOString();

const listing = (
  partial: Pick<SellerListingDto, 'listingId' | 'eventName' | 'originalTicketCode' | 'netSellerPayout' | 'unlockAt'>
): SellerListingDto => ({
  eventId: 'preview-event',
  eventVenue: 'Nhà hát Hòa Bình, TP.HCM',
  eventStartAt: hours(72),
  tierId: 'vip',
  tierName: 'VIP',
  originalPrice: 1_200_000,
  resalePrice: 1_000_000,
  discountAmount: 0,
  discountPercentage: 0,
  isPrivate: false,
  privateAccessToken: null,
  shareUrl: null,
  verificationStatus: 'Verified',
  listingStatus: 'Sold',
  escrowStatus: 'Locked',
  inSettlementBuffer: true,
  createdAt: new Date().toISOString(),
  ...partial,
});

const payout = (partial: Partial<MyPayoutDto> & Pick<MyPayoutDto, 'payoutId' | 'status' | 'escrowStatus' | 'amount' | 'eventName'>): MyPayoutDto => ({
  payoutCode: partial.payoutId,
  escrowId: partial.payoutId,
  unlockAt: hours(-1),
  originalTicketCode: 'TS-00000',
  recipientBankCode: 'MB',
  recipientAccountNumber: '0901234567890',
  recipientAccountName: 'NGUYEN THANH TUNG',
  bankReferenceCode: null,
  retryCount: 0,
  lastErrorMessage: null,
  processedAt: null,
  createdAt: new Date().toISOString(),
  ...partial,
});

const sampleListings: SellerListingDto[] = [
  listing({
    listingId: 'hold-1',
    eventName: 'Hoàng Dũng Live at The Factory',
    originalTicketCode: 'TS-88421',
    netSellerPayout: 1_250_000,
    unlockAt: hours(18.4),
  }),
  listing({
    listingId: 'hold-2',
    eventName: 'MONO City Show',
    originalTicketCode: 'TS-22910',
    netSellerPayout: 680_000,
    unlockAt: hours(0.42),
  }),
  listing({
    listingId: 'hold-3',
    eventName: 'Concert Đêm nhạc Trịnh',
    originalTicketCode: 'TS-11008',
    netSellerPayout: 420_000,
    unlockAt: hours(-0.2),
  }),
];

const samplePayouts: MyPayoutDto[] = [
  payout({
    payoutId: 'p-1',
    eventName: 'Anh Trai Vượt Ngàn Chông Gai',
    originalTicketCode: 'TS-55102',
    amount: 2_400_000,
    status: 'Success',
    escrowStatus: 'Released',
    bankReferenceCode: 'FT20261004110288',
    createdAt: hours(-26),
  }),
  payout({
    payoutId: 'p-2',
    eventName: 'Wren Evans Tour',
    originalTicketCode: 'TS-33017',
    amount: 890_000,
    status: 'Processing',
    escrowStatus: 'Releasing',
    recipientBankCode: 'VCB',
    recipientAccountNumber: '0123456789012',
    createdAt: hours(-2),
  }),
  payout({
    payoutId: 'p-3',
    eventName: 'Concert Đêm nhạc Trịnh',
    originalTicketCode: 'TS-11002',
    amount: 510_000,
    status: 'Failed',
    escrowStatus: 'Releasing',
    recipientBankCode: 'TCB',
    recipientAccountNumber: '19034567890123',
    createdAt: hours(-5),
  }),
];

/** Local-only layout check. Removed before any push. */
export const RevenuePreviewPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F5] pt-28 pb-24 px-4 sm:px-6 md:px-12">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src="/images/landing/festival.jpg" alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/80 via-[#05070A]/92 to-[#05070A]" />
        </div>
      <div className="relative z-10 max-w-[1220px] mx-auto space-y-8">
        <div className="space-y-2 pb-2 border-b border-white/[0.06]">
          <span className="text-[11px] font-bold font-mono uppercase tracking-[0.18em] text-[#FF5A36]">Seller console</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display uppercase tracking-tight">My listings</h1>
          <p className="text-xs font-mono text-[#8B929C]">Sample data for layout review. No API calls.</p>
        </div>
        <div className="inline-flex p-1.5 bg-[#0B0E12] border border-white/[0.08] rounded-2xl" role="tablist" aria-label="Seller sections">
          <span className="px-5 py-2.5 text-xs font-bold font-mono tracking-wider text-[#8B929C]">My tickets</span>
          <span className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider bg-[#11151B] text-[#F5F5F5] border border-[#FF5A36]">
            Revenue
          </span>
        </div>
        <RevenueTab preview={{ listings: sampleListings, payouts: samplePayouts }} />
      </div>
    </div>
  );
};
