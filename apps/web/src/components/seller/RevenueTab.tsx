import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { MyPayoutDto, SellerListingDto } from '@ticketshield/types';
import { listingsFailedBeforeAnyData, useMyListings } from '../../hooks/useMyListings';
import { useMyPayouts } from '../../hooks/useMyPayouts';
import { formatVND } from '../../utils/formatters';

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  Pending: 'Pending',
  Processing: 'Sending',
  Success: 'Sent',
  Failed: 'Could not send',
};

const ESCROW_STATUS_LABEL: Record<string, string> = {
  Pending: 'Awaiting payment',
  Locked: 'On hold',
  Releasing: 'Awaiting receipt',
  Released: 'Paid out',
  Refunded: 'Refunded',
  Disputed: 'In dispute',
  RefundQueued: 'Refunding',
  Expired: 'Expired',
  Cancelled: 'Cancelled',
};

const labelOf = (map: Record<string, string>, value?: string | null) => {
  if (!value) return '—';
  return map[value] ?? value;
};

export function selectHoldingListings(listings: SellerListingDto[]): SellerListingDto[] {
  return listings
    .filter((listing) => listing.escrowStatus === 'Locked' && !!listing.unlockAt)
    .slice()
    .sort((a, b) => new Date(a.unlockAt!).getTime() - new Date(b.unlockAt!).getTime());
}

export function formatHoldCountdown(unlockAt: string, now: number): {
  waiting: boolean;
  hours: string;
  minutes: string;
  seconds: string;
} {
  const pad = (value: number) => String(value).padStart(2, '0');
  const target = new Date(unlockAt).getTime();
  if (Number.isNaN(target) || target <= now) {
    return { waiting: true, hours: '00', minutes: '00', seconds: '00' };
  }
  const totalSeconds = Math.floor((target - now) / 1000);
  return {
    waiting: false,
    hours: pad(Math.floor(totalSeconds / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
  };
}

const statusDot = (status: string) => {
  if (status === 'Success') return 'bg-[#20C997]';
  if (status === 'Failed') return 'bg-rose-400';
  if (status === 'Processing' || status === 'Pending') return 'bg-amber-300';
  return 'bg-white/40';
};

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const datePart = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return `${datePart} ${timePart}`;
};

export const RevenueTab: React.FC<{
  preview?: { listings: SellerListingDto[]; payouts: MyPayoutDto[] };
}> = ({ preview }) => {
  const listingsQuery = useMyListings(preview ? undefined : 60_000, !preview);
  const payoutsQuery = useMyPayouts(!preview);
  const now = useNow();

  const holding = useMemo(
    () => selectHoldingListings(preview?.listings ?? listingsQuery.data ?? []),
    [preview?.listings, listingsQuery.data]
  );
  const payouts = preview?.payouts ?? payoutsQuery.data ?? [];
  const listingsPending = !preview && listingsQuery.isPending;
  const listingsError = !preview && listingsFailedBeforeAnyData(listingsQuery.data, listingsQuery.isError);
  const payoutsPending = !preview && payoutsQuery.isPending;
  const payoutsError = !preview && payoutsQuery.isError;

  return (
    <div className="space-y-12">
      <section className="space-y-4" aria-labelledby="revenue-holding-heading">
        <SectionTitle id="revenue-holding-heading" kicker="24 hours" title="On hold" />

        {listingsPending && <HoldingSkeleton />}
        {listingsError && (
          <Notice
            title="Could not load your listings"
            detail={listingsQuery.error instanceof Error ? listingsQuery.error.message : 'Check your connection, then try again.'}
            onRetry={() => listingsQuery.refetch()}
            busy={listingsQuery.isFetching}
          />
        )}
        {!listingsPending && !listingsError && holding.length === 0 && (
          <EmptyLine text="No payouts are in the 24-hour hold." />
        )}
        {!listingsPending && !listingsError && holding.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0E12]">
            {holding.map((listing, index) => (
              <HoldingRow key={listing.listingId} listing={listing} now={now} divided={index > 0} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="revenue-history-heading">
        <SectionTitle id="revenue-history-heading" kicker="History" title="Payouts" />

        {payoutsPending && <HistorySkeleton />}
        {payoutsError && (
          <Notice
            title="Could not load payout history"
            detail={payoutsQuery.error instanceof Error ? payoutsQuery.error.message : 'Check your connection, then try again.'}
            onRetry={() => payoutsQuery.refetch()}
            busy={payoutsQuery.isFetching}
          />
        )}
        {!payoutsPending && !payoutsError && payouts.length === 0 && (
          <EmptyLine text="No payouts yet." />
        )}
        {!payoutsPending && !payoutsError && payouts.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0E12]">
            {payouts.map((payout, index) => (
              <PayoutRow key={payout.payoutId} payout={payout} divided={index > 0} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const SectionTitle: React.FC<{ id: string; kicker: string; title: string }> = ({ id, kicker, title }) => (
  <div>
    <p className="text-[11px] font-mono font-medium uppercase tracking-[0.18em] text-[#FF5A36]">{kicker}</p>
    <h2 id={id} className="mt-1 font-display text-2xl font-semibold tracking-tight text-[#F5F5F5]">
      {title}
    </h2>
  </div>
);

const HoldingRow: React.FC<{ listing: SellerListingDto; now: number; divided: boolean }> = ({ listing, now, divided }) => {
  const amount = listing.netSellerPayout == null ? '—' : formatVND(listing.netSellerPayout);

  return (
    <article className={`flex flex-col gap-6 px-5 py-5 sm:px-6 sm:py-6 md:flex-row md:items-center md:justify-between ${divided ? 'border-t border-white/[0.06]' : ''}`}>
      <div className="min-w-0">
        <h3 className="truncate font-display text-xl font-semibold tracking-tight text-[#F5F5F5]">{listing.eventName}</h3>
        <p className="mt-1 font-mono text-xs text-[#8B929C]">{listing.originalTicketCode}</p>
        <p className="mt-4 font-display text-[1.75rem] font-semibold tabular-nums leading-none text-[#F5F5F5]">{amount}</p>
      </div>
      <ClockWell unlockAt={listing.unlockAt!} now={now} />
    </article>
  );
};

const ClockWell: React.FC<{ unlockAt: string; now: number }> = ({ unlockAt, now }) => {
  const countdown = formatHoldCountdown(unlockAt, now);

  if (countdown.waiting) {
    return (
      <div className="shrink-0 rounded-xl border border-amber-300/25 bg-[#05070A] px-4 py-3 md:min-w-[15rem]">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200/70">Status</p>
        <p className="mt-1 text-lg font-medium text-amber-100">The 24-hour hold has ended. Waiting for payout.</p>
      </div>
    );
  }

  return (
    <div
      role="timer"
      aria-label={`${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds remaining`}
    >
      <div aria-hidden="true" className="flex shrink-0 items-start gap-2">
        <ClockCell value={countdown.hours} unit="hr" />
        <ClockColon />
        <ClockCell value={countdown.minutes} unit="min" />
        <ClockColon />
        <ClockCell value={countdown.seconds} unit="sec" />
      </div>
    </div>
  );
};

const ClockCell: React.FC<{ value: string; unit: string }> = ({ value, unit }) => (
  <div className="w-[4.25rem] rounded-xl border border-white/[0.08] bg-[#05070A] px-1 py-2.5 text-center">
    <div className="font-mono text-[1.75rem] font-medium tabular-nums leading-none tracking-tight text-[#F5F5F5]">{value}</div>
    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B929C]">{unit}</div>
  </div>
);

const ClockColon: React.FC = () => (
  <span aria-hidden="true" className="pt-2 font-mono text-2xl leading-none text-white/25">
    :
  </span>
);

const PayoutRow: React.FC<{ payout: MyPayoutDto; divided: boolean }> = ({ payout, divided }) => {
  const payoutLabel = labelOf(PAYOUT_STATUS_LABEL, payout.status);
  const escrowLabel = labelOf(ESCROW_STATUS_LABEL, payout.escrowStatus);

  return (
    <article className={`grid grid-cols-1 gap-4 px-5 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_14rem] md:items-start ${divided ? 'border-t border-white/[0.06]' : ''}`}>
      <div className="min-w-0">
        <h3 className="truncate font-display text-lg font-semibold tracking-tight text-[#F5F5F5]">{payout.eventName}</h3>
        <p className="mt-1 font-mono text-xs text-[#8B929C]">{payout.originalTicketCode}</p>
        <p className="mt-3 text-sm text-[#C8CDD4]">
          {payout.recipientBankCode}
          <span className="px-1.5 text-white/20">/</span>
          <span className="font-mono">{payout.recipientAccountNumber}</span>
        </p>
        {payout.recipientAccountName && (
          <p className="mt-0.5 text-xs tracking-wide text-[#8B929C]">{payout.recipientAccountName}</p>
        )}
      </div>
      <div className="flex flex-col md:items-end">
        <p className="font-display text-2xl font-semibold tabular-nums leading-none text-[#F5F5F5]">{formatVND(payout.amount)}</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-[#F5F5F5]">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot(payout.status)}`} aria-hidden="true" />
          {payoutLabel}
        </p>
        {payout.status === 'Failed' && (
          <p className="mt-1 text-xs text-[#C8CDD4]">Check the receiving account.</p>
        )}
        <p className="mt-1 text-xs text-[#8B929C]">{escrowLabel}</p>
        <p className="mt-3 font-mono text-[11px] text-[#8B929C]">Receipt {payout.bankReferenceCode || '—'}</p>
        <p className="font-mono text-[11px] text-[#8B929C]">{formatWhen(payout.createdAt)}</p>
      </div>
    </article>
  );
};

const EmptyLine: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-8 px-6 bg-[#0B0E12] border border-white/[0.08] rounded-2xl text-center">
    <p className="text-sm text-[#8B929C]">{text}</p>
  </div>
);

const Notice: React.FC<{ title: string; detail: string; onRetry: () => void; busy: boolean }> = ({
  title,
  detail,
  onRetry,
  busy,
}) => (
  <div className="py-10 px-6 bg-[#0B0E12] border border-white/[0.08] rounded-2xl flex flex-col items-center text-center gap-3">
    <AlertTriangle className="w-5 h-5 text-rose-300" />
    <h3 className="font-bold text-[#F5F5F5]">{title}</h3>
    <p className="text-xs text-[#8B929C] max-w-md">{detail}</p>
    <button
      type="button"
      onClick={onRetry}
      disabled={busy}
      className="mt-1 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
      Try again
    </button>
  </div>
);

const HoldingSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0E12]" aria-busy="true" aria-label="Loading payouts on hold">
    {[0, 1].map((row) => (
      <div key={row} className={`flex items-center justify-between gap-6 px-6 py-6 animate-pulse ${row ? 'border-t border-white/[0.06]' : ''}`}>
        <div className="space-y-3">
          <div className="h-5 w-56 rounded bg-white/[0.08]" />
          <div className="h-3 w-24 rounded bg-white/[0.04]" />
          <div className="h-7 w-36 rounded bg-white/[0.08]" />
        </div>
        <div className="hidden h-16 w-52 rounded-xl bg-white/[0.04] sm:block" />
      </div>
    ))}
  </div>
);

const HistorySkeleton: React.FC = () => (
  <div className="h-36 rounded-2xl border border-white/[0.08] bg-[#0B0E12] animate-pulse" aria-busy="true" aria-label="Loading payout history" />
);

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
