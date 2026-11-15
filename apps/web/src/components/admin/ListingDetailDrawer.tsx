import React from 'react';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import type { AdminListingDto } from '@ticketshield/api-client';
import { AdminDetailDrawer, DrawerRow, DrawerSection } from './AdminDetailDrawer';
import { Pill, RetryButton, errorText, listingTone, verdictTone } from './AdminOpsUi';
import { CopyButton } from '../ui/CopyButton';
import { useAdminComboTickets } from '../../hooks/useAdminListings';
import { VERIFICATION_STATUS_LABEL, labelOf, listingStatusLabel } from '../../utils/moneyStatus';
import { formatEventDateTime } from '../../utils/formatters';
import {
  VERDICT_LABEL,
  capChanged,
  ceilingVerdict,
  comboLabel,
  formatMoney,
  formatPercent,
} from '../../utils/adminOps';

/** Đủ vé trong combo, gọi API riêng theo bundleId vì phân trang có thể cắt combo ra nhiều trang. */
const ComboTickets: React.FC<{ listing: AdminListingDto }> = ({ listing }) => {
  const { data, isPending, isError, error, refetch, isFetching } = useAdminComboTickets(listing.bundleId);

  if (!listing.bundleId) {
    return <p className="text-xs text-[#667085]">This listing has no combo id, so its other tickets cannot be listed.</p>;
  }
  if (isPending) {
    return (
      <p className="flex items-center gap-2 text-xs text-[#667085]">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F45135]" /> Loading combo tickets...
      </p>
    );
  }
  if (isError && !data) {
    return (
      <div role="alert" className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
        <p>{errorText(error, 'Could not load the tickets in this combo.')}</p>
        <RetryButton onClick={() => void refetch()} busy={isFetching} />
      </div>
    );
  }

  const tickets = data?.listings.items ?? [];
  return (
    <ul className="divide-y divide-[#E5EAF0] rounded-lg border border-[#E5EAF0]">
      {tickets.map((t) => (
        <li
          key={t.listingId}
          className={`flex items-center justify-between gap-3 px-3 py-2 text-xs ${t.listingId === listing.listingId ? 'bg-[#FFF4F1]/60' : ''}`}
        >
          <div className="min-w-0">
            <p className="font-mono text-[#101722] truncate">{t.originalTicketCode}</p>
            <p className="text-[#667085]">{t.seatZone || 'No zone'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-mono tabular-nums">{formatMoney(t.resalePrice)}</span>
            <Pill tone={listingTone(t.listingStatus)}>{listingStatusLabel(t.listingStatus)}</Pill>
          </div>
        </li>
      ))}
    </ul>
  );
};

interface ListingDetailDrawerProps {
  listing: AdminListingDto;
  onFilterSeller: (sellerId: string) => void;
  onClose: () => void;
}

/** Chi tiết một tin đăng (SCRUM-337). Chỉ xem: không có nút duyệt, gỡ hay sửa tin. */
export const ListingDetailDrawer: React.FC<ListingDetailDrawerProps> = ({ listing, onFilterSeller, onClose }) => {
  const verdict = ceilingVerdict(listing);
  const changed = capChanged(listing);
  const combo = comboLabel(listing);

  return (
    <AdminDetailDrawer
      eyebrow="Listing"
      title={listing.eventName || 'Unknown event'}
      subtitle={`${listing.tierName || 'No tier'}${listing.seatZone ? ` · Zone ${listing.seatZone}` : ''} · listed ${formatEventDateTime(listing.createdAt)}`}
      onClose={onClose}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={listingTone(listing.listingStatus)}>{listingStatusLabel(listing.listingStatus)}</Pill>
        <Pill tone="slate">{labelOf(VERIFICATION_STATUS_LABEL, listing.verificationStatus)}</Pill>
        <Pill tone="slate">
          {listing.isPrivate && <Lock className="h-3 w-3" />}
          {listing.isPrivate ? 'PRIVATE' : 'PUBLIC'}
        </Pill>
        {combo && <Pill tone="slate">{combo}</Pill>}
      </div>

      <DrawerSection title="Ticket">
        <div className="rounded-lg border border-[#E5EAF0] px-3 py-1.5">
          <DrawerRow label="Ticket code">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-mono">{listing.originalTicketCode}</span>
              <CopyButton value={listing.originalTicketCode} iconOnly variant="ghost" ariaLabel="Copy ticket code" />
            </span>
          </DrawerRow>
          <DrawerRow label="Tier">{listing.tierName || '—'}</DrawerRow>
          <DrawerRow label="Zone">{listing.seatZone || '—'}</DrawerRow>
        </div>
      </DrawerSection>

      <DrawerSection title="Price check">
        <div className="rounded-lg border border-[#E5EAF0] px-3 py-1.5">
          <DrawerRow label="Original price">{formatMoney(listing.originalPrice)}</DrawerRow>
          <DrawerRow label={`Cap when listed (+${formatPercent(listing.appliedMarkupPercentage)})`}>
            {formatMoney(listing.maxAllowedPrice)}
          </DrawerRow>
          <DrawerRow label="Event cap now">
            <span className="inline-flex items-center gap-1.5">
              {listing.eventMaxMarkupPercentage > 0 ? `+${formatPercent(listing.eventMaxMarkupPercentage)}` : '—'}
              {changed && <Pill tone="violet">Cap changed</Pill>}
            </span>
          </DrawerRow>
          <DrawerRow label="Resale price" strong>
            {formatMoney(listing.resalePrice)}
          </DrawerRow>
          <DrawerRow label="Discount">
            {listing.discountAmount > 0
              ? `${formatMoney(listing.discountAmount)} (${formatPercent(listing.discountPercentage)})`
              : formatMoney(0)}
          </DrawerRow>
          <DrawerRow label="Markup">{formatPercent(listing.actualMarkupPercentage)}</DrawerRow>
          <DrawerRow label="Verdict">
            <Pill tone={verdictTone(verdict)}>{VERDICT_LABEL[verdict]}</Pill>
          </DrawerRow>
        </div>
      </DrawerSection>

      <DrawerSection title="Seller">
        <div className="rounded-lg border border-[#E5EAF0] p-2.5 text-xs">
          <p className="font-semibold text-[#101722]">{listing.sellerName || '—'}</p>
          <p className="text-[#667085]">{listing.sellerEmail || '—'}</p>
          <p className="font-mono text-[#667085]">{listing.sellerPhone || '—'}</p>
          <button
            type="button"
            onClick={() => onFilterSeller(listing.sellerId)}
            className="mt-2 inline-flex items-center gap-1 font-semibold text-[#F45135] hover:underline cursor-pointer"
          >
            All listings by this seller <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </DrawerSection>

      {combo && (
        <DrawerSection
          title={`Combo · ${listing.bundleTotalTickets || 2} tickets · ${
            listing.isBundleAllOrNothing ? 'whole combo only' : 'tickets sold separately'
          }`}
        >
          <ComboTickets listing={listing} />
        </DrawerSection>
      )}
    </AdminDetailDrawer>
  );
};
