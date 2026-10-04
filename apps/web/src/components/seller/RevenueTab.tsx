import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, Check, Clock, MapPin, RefreshCw } from 'lucide-react';
import type { MyPayoutDto, SellerListingDto } from '@ticketshield/types';
import { listingsFailedBeforeAnyData, useMyListings } from '../../hooks/useMyListings';
import { useMyPayouts } from '../../hooks/useMyPayouts';
import { formatEventDateTime, formatVND } from '../../utils/formatters';

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

const EVENT_THUMBNAILS = [
  '/images/landing/featured-1.jpg',
  '/images/landing/featured-2.jpg',
  '/images/landing/concert.jpg',
  '/images/landing/festival.jpg',
  '/images/landing/hero-concert.jpg',
];

function eventThumbnail(listingId: string) {
  const sum = listingId.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return EVENT_THUMBNAILS[sum % EVENT_THUMBNAILS.length];
}

const payoutMark = (status: string) => {
  if (status === 'Success') return { icon: Check, className: 'text-[#20C997]' };
  if (status === 'Failed') return { icon: AlertTriangle, className: 'text-rose-300' };
  if (status === 'Processing' || status === 'Pending') return { icon: Clock, className: 'text-amber-200' };
  return { icon: Clock, className: 'text-[#8B929C]' };
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
  const listingsQuery = useMyListings(preview ? undefined : 3_000, !preview);
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

        <div className="space-y-4">
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
          {!listingsPending && !listingsError && holding.length > 0 &&
            holding.map((listing) => (
              <HoldingTicket key={listing.listingId} listing={listing} now={now} />
            ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="revenue-history-heading">
        <SectionTitle id="revenue-history-heading" kicker="History" title="Payouts" />

        <div className="max-w-[34rem] space-y-3">
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
          {!payoutsPending && !payoutsError && payouts.length > 0 &&
            payouts.map((payout) => (
              <PayoutSlip key={payout.payoutId} payout={payout} />
            ))}
        </div>
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

const HoldingTicket: React.FC<{ listing: SellerListingDto; now: number }> = ({ listing, now }) => {
  const amount = listing.netSellerPayout == null ? '—' : formatVND(listing.netSellerPayout);

  return (
    <article className="group relative flex flex-col items-start justify-between gap-6 rounded-2xl border border-white/[0.08] bg-[#0B0E12] p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF5A36]/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6 lg:flex-row lg:items-center">
      <div className="flex w-full min-w-0 flex-col items-start gap-4 sm:flex-row sm:gap-5 lg:w-auto">
        <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#11151B] sm:h-28 sm:w-36 md:h-32 md:w-44">
          <img
            src={eventThumbnail(listing.listingId)}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute bottom-2 left-2 rounded border border-white/10 bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">
            {listing.tierName || 'TICKET PASS'}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div>
            <h3 className="truncate text-base font-extrabold uppercase leading-snug tracking-tight text-[#F5F5F5] transition-colors group-hover:text-[#FF7252] sm:text-lg">
              {listing.eventName}
            </h3>
            <p className="mt-0.5 font-mono text-xs font-semibold tracking-wider text-[#FF5A36]">{listing.tierName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[#8B929C]">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-[#8B929C]/80" aria-hidden="true" />
              <span>{formatEventDateTime(listing.eventStartAt)}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#8B929C]/80" aria-hidden="true" />
              <span className="max-w-[240px] truncate">{listing.eventVenue}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-black/75 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 motion-reduce:animate-none" aria-hidden="true" />
              <span>ON HOLD</span>
            </span>
            <span className="pl-1 font-mono text-[11px] text-[#8B929C]/70">ID · {listing.originalTicketCode}</span>
          </div>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col items-start justify-center gap-4 border-t border-white/[0.06] pt-3 lg:w-auto lg:items-end lg:border-t-0 lg:pt-0">
        <div className="space-y-0.5 text-left lg:text-right">
          <p className="font-display text-2xl font-extrabold tabular-nums tracking-tight text-[#F5F5F5] sm:text-3xl">{amount}</p>
          <p className="font-mono text-xs text-[#8B929C]">You receive</p>
        </div>
        <ClockWell unlockAt={listing.unlockAt!} now={now} />
      </div>
    </article>
  );
};

const ClockWell: React.FC<{ unlockAt: string; now: number }> = ({ unlockAt, now }) => {
  const countdown = formatHoldCountdown(unlockAt, now);

  if (countdown.waiting) {
    return (
      <p className="max-w-[16rem] text-left font-mono text-xs leading-relaxed text-amber-200 lg:text-right">
        Hold ended. Waiting for payout.
      </p>
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
  <div className="w-14 rounded-xl border border-white/[0.08] bg-[#05070A] px-1 py-2 text-center sm:w-[4.25rem] sm:py-2.5">
    <div className="font-mono text-2xl font-medium tabular-nums leading-none tracking-tight text-[#F5F5F5] sm:text-[1.75rem]">{value}</div>
    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B929C]">{unit}</div>
  </div>
);

const ClockColon: React.FC = () => (
  <span aria-hidden="true" className="pt-2 font-mono text-2xl leading-none text-white/25">
    :
  </span>
);

const PayoutSlip: React.FC<{ payout: MyPayoutDto }> = ({ payout }) => {
  const payoutLabel = labelOf(PAYOUT_STATUS_LABEL, payout.status);
  const escrowLabel = labelOf(ESCROW_STATUS_LABEL, payout.escrowStatus);
  const receipt = payout.bankReferenceCode ?? 'No receipt yet';
  const mark = payoutMark(payout.status);
  const MarkIcon = mark.icon;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0E12] shadow-lg">
      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold uppercase leading-snug tracking-tight text-[#F5F5F5]">
              {payout.eventName}
            </h3>
            <p className="mt-0.5 font-mono text-xs font-semibold tracking-wider text-[#FF5A36]">{payout.originalTicketCode}</p>
          </div>
          <p className="shrink-0 font-display text-xl font-extrabold tabular-nums tracking-tight text-[#F5F5F5]">
            {formatVND(payout.amount)}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1.5">
          <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8B929C]">Paid to</dt>
          <dd className="truncate text-sm text-[#F5F5F5]">
            {payout.recipientBankCode}
            <span className="px-1.5 text-white/25" aria-hidden="true">/</span>
            <span className="font-mono">{payout.recipientAccountNumber}</span>
          </dd>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8B929C]">Name</dt>
          <dd className="truncate text-sm tracking-wide text-[#F5F5F5]">{payout.recipientAccountName || '—'}</dd>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8B929C]">Status</dt>
          <dd className={`inline-flex min-w-0 items-center gap-1.5 text-sm ${mark.className}`}>
            <MarkIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {payoutLabel}
              <span className="text-[#8B929C]"> · {escrowLabel}</span>
            </span>
          </dd>
        </dl>
        {payout.status === 'Failed' && (
          <p className="mt-3 text-xs leading-relaxed text-rose-200">Check the receiving account.</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-dashed border-white/15 bg-[#05070A] px-4 py-2.5 font-mono text-[11px] text-[#8B929C] sm:px-5">
        <span className="truncate">Receipt {receipt}</span>
        <span className="shrink-0">{formatWhen(payout.createdAt)}</span>
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
  <div className="space-y-4" aria-busy="true" aria-label="Loading payouts on hold">
    {[0, 1].map((row) => (
      <div key={row} className="flex animate-pulse flex-col gap-5 rounded-2xl border border-white/[0.08] bg-[#0B0E12] p-6 lg:flex-row lg:items-center">
        <div className="flex gap-4">
          <div className="h-28 w-36 rounded-xl bg-white/[0.04]" />
          <div className="space-y-2.5">
            <div className="h-5 w-48 rounded bg-white/[0.08]" />
            <div className="h-3 w-24 rounded bg-white/[0.04]" />
            <div className="h-3 w-40 rounded bg-white/[0.04]" />
          </div>
        </div>
        <div className="ml-auto hidden h-16 w-52 rounded-xl bg-white/[0.04] lg:block" />
      </div>
    ))}
  </div>
);

const HistorySkeleton: React.FC = () => (
  <div className="h-36 animate-pulse rounded-2xl border border-white/[0.08] bg-[#0B0E12]" aria-busy="true" aria-label="Loading payout history" />
);

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
