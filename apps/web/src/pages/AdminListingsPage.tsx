import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, X } from 'lucide-react';
import { adminApi, type AdminListingDto } from '@ticketshield/api-client';
import {
  ClearFiltersButton,
  DateRangeInputs,
  ErrorBanner,
  FilterBar,
  FilterSelect,
  FilterToggle,
  PageHeader,
  Pagination,
  Pill,
  RetryButton,
  SearchBox,
  StatCard,
  TableMessage,
  TableShell,
  errorText,
  listingTone,
} from '../components/admin/AdminOpsUi';
import { ListingDetailDrawer } from '../components/admin/ListingDetailDrawer';
import { useAdminListings } from '../hooks/useAdminListings';
import { useUrlFilters } from '../hooks/useUrlFilters';
import {
  capChanged,
  ceilingVerdict,
  comboLabel,
  formatMoney,
  formatPercent,
  readListingFilters,
  toListingParams,
  writeListingFilters,
  type ListingType,
} from '../utils/adminOps';
import { formatEventDateTime } from '../utils/formatters';
import { LISTING_STATUS_LABEL, VERIFICATION_STATUS_LABEL, listingStatusLabel } from '../utils/moneyStatus';

const TYPE_OPTIONS: Array<{ value: ListingType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'single', label: 'Single' },
  { value: 'combo', label: 'Combo' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All listing statuses' },
  { value: 'Draft', label: 'DRAFT' },
  ...Object.entries(LISTING_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const VERIFICATION_OPTIONS = [
  { value: '', label: 'All verification' },
  ...Object.entries(VERIFICATION_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const COLUMNS = 7;

const BAR_COLOR = { UNDER: 'bg-emerald-500', AT_CAP: 'bg-amber-500', OVER: 'bg-rose-500' } as const;

/** Thanh mức tăng so với trần lúc đăng tin. Giá dưới giá gốc thì thanh rỗng và ghi số âm. */
const MarkupBar: React.FC<{ listing: AdminListingDto }> = ({ listing }) => {
  const verdict = ceilingVerdict(listing);
  const cap = listing.appliedMarkupPercentage;
  const ratio = cap > 0 ? Math.min(Math.max(listing.actualMarkupPercentage / cap, 0), 1) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className={`h-full rounded-full ${BAR_COLOR[verdict]}`} style={{ width: `${ratio * 100}%` }} />
        </div>
        <span className="font-mono text-[11px] text-[#101722] whitespace-nowrap">
          {formatPercent(listing.actualMarkupPercentage)} / {formatPercent(cap)}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {verdict === 'AT_CAP' && <Pill tone="amber">At cap</Pill>}
        {verdict === 'OVER' && <Pill tone="rose">Over cap</Pill>}
        {capChanged(listing) && <Pill tone="violet">Cap changed</Pill>}
      </div>
    </div>
  );
};

/** Tin bán lại và vé trong combo của toàn sàn (SCRUM-337). Chỉ xem. Bộ lọc nằm trên URL. */
export const AdminListingsPage: React.FC = () => {
  const { filters, update, reset } = useUrlFilters(readListingFilters, writeListingFilters);
  const params = useMemo(() => toListingParams(filters), [filters]);
  const { data, isPending, isError, error, refetch, isFetching } = useAdminListings(params);
  const events = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => adminApi.getAllEventMarkups(),
    refetchOnWindowFocus: false,
  });
  const [selected, setSelected] = useState<AdminListingDto | null>(null);

  const summary = data?.summary;
  const page = data?.listings;
  const rows = page?.items ?? [];
  const failedFirstLoad = isError && !data;
  const hasFilters = !!(
    filters.keyword ||
    filters.type !== 'all' ||
    filters.status ||
    filters.verification ||
    filters.eventId ||
    filters.sellerId ||
    filters.atCapOnly ||
    filters.from ||
    filters.to
  );

  const eventOptions = useMemo(() => {
    const list = (events.data ?? []).map((e) => ({ value: e.eventId, label: e.eventName }));
    // Link từ Dashboard có thể trỏ tới sự kiện chưa có trong danh sách trần giá: vẫn giữ lựa chọn đó.
    if (filters.eventId && !list.some((o) => o.value === filters.eventId)) {
      const name = rows.find((r) => r.eventId === filters.eventId)?.eventName ?? 'Selected event';
      list.unshift({ value: filters.eventId, label: name });
    }
    return [{ value: '', label: 'All events' }, ...list];
  }, [events.data, filters.eventId, rows]);

  const sellerName = filters.sellerId ? rows.find((r) => r.sellerId === filters.sellerId)?.sellerName : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Listings"
        badge={page ? `${page.totalCount} tickets` : undefined}
        onRefresh={() => void refetch()}
        refreshing={isFetching}
      />

      {/* Số toàn sàn, không theo bộ lọc. */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard allTime label="Listings" value={summary ? summary.totalListings : '—'} />
        <StatCard allTime label="Singles" value={summary ? summary.totalSingleTickets : '—'} />
        <StatCard allTime label="Combos" value={summary ? summary.totalBundles : '—'} />
        <StatCard allTime label="On sale" value={summary ? summary.totalActiveListings : '—'} />
        <StatCard allTime label="Sold" value={summary ? summary.totalSoldListings : '—'} />
        <StatCard allTime label="At cap" value={summary ? summary.totalAtCeilingListings : '—'} />
      </div>

      <FilterBar>
        <SearchBox value={filters.keyword} onChange={(keyword) => update({ keyword })} placeholder="Ticket code, event, seller" />
        <div role="group" aria-label="Listing type" className="inline-flex rounded-lg border border-[#E5EAF0] bg-slate-50 p-0.5">
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={filters.type === o.value}
              onClick={() => update({ type: o.value })}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                filters.type === o.value ? 'bg-white text-[#101722] shadow-2xs' : 'text-[#667085] hover:text-[#101722]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <FilterSelect ariaLabel="Listing status" value={filters.status} onChange={(status) => update({ status })} options={STATUS_OPTIONS} />
        <FilterSelect
          ariaLabel="Verification status"
          value={filters.verification}
          onChange={(verification) => update({ verification })}
          options={VERIFICATION_OPTIONS}
        />
        <FilterSelect ariaLabel="Event" value={filters.eventId} onChange={(eventId) => update({ eventId })} options={eventOptions} />
        <FilterToggle checked={filters.atCapOnly} onChange={(atCapOnly) => update({ atCapOnly })} label="At cap only" />
        <DateRangeInputs from={filters.from} to={filters.to} onChange={(range) => update(range)} />
        {filters.sellerId && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#F45135]/30 bg-[#FFF4F1] text-xs text-[#B4321C]">
            Seller: {sellerName ?? `${filters.sellerId.slice(0, 8)}…`}
            <button type="button" aria-label="Remove seller filter" onClick={() => update({ sellerId: '' })} className="cursor-pointer">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {hasFilters && <ClearFiltersButton onClick={reset} />}
      </FilterBar>

      {isError && data && (
        <ErrorBanner message={errorText(error, 'Could not refresh listings.')} onRetry={() => void refetch()} busy={isFetching} />
      )}

      <TableShell
        head={
          <tr>
            <th className="py-3 px-3 min-w-[96px]">Listed</th>
            <th className="py-3 px-3 min-w-[170px]">Event · Tier · Zone</th>
            <th className="py-3 px-3 min-w-[120px]">Ticket</th>
            <th className="py-3 px-3 min-w-[110px]">Seller</th>
            <th className="py-3 px-3 text-right min-w-[120px]">Original → Resale</th>
            <th className="py-3 px-3 min-w-[150px]">Markup vs cap</th>
            <th className="py-3 px-3 min-w-[96px]">Status</th>
          </tr>
        }
      >
        {isPending ? (
          <TableMessage colSpan={COLUMNS} kind="loading" title="Loading listings..." />
        ) : failedFirstLoad ? (
          <TableMessage
            colSpan={COLUMNS}
            kind="error"
            title="Unable to load listings"
            detail={errorText(error)}
            action={<RetryButton onClick={() => void refetch()} busy={isFetching} />}
          />
        ) : rows.length === 0 ? (
          <TableMessage
            colSpan={COLUMNS}
            kind="empty"
            title={hasFilters ? 'No listings match these filters' : 'No listings yet'}
            action={hasFilters ? <ClearFiltersButton onClick={reset} /> : undefined}
          />
        ) : (
          rows.map((l) => {
            const combo = comboLabel(l);
            return (
              <tr
                key={l.listingId}
                tabIndex={0}
                onClick={() => setSelected(l)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(l);
                  }
                }}
                className="hover:bg-slate-50/70 focus:bg-slate-50 focus:outline-none cursor-pointer align-top"
              >
                <td className="py-3 px-3 font-mono text-[#667085]">{formatEventDateTime(l.createdAt)}</td>
                <td className="py-3 px-3">
                  <p className="font-semibold text-[#101722] truncate max-w-[220px]">{l.eventName || '—'}</p>
                  <p className="text-[11px] text-[#667085]">
                    {l.tierName || '—'}
                    {l.seatZone ? ` · ${l.seatZone}` : ''}
                  </p>
                </td>
                <td className="py-3 px-3">
                  <p className="font-mono text-[11px] text-[#101722] truncate max-w-[140px]" title={l.maskedTicketCode}>
                    {l.maskedTicketCode}
                  </p>
                  {combo && (
                    <div className="mt-1">
                      <Pill tone="slate">{combo}</Pill>
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-[#101722] truncate max-w-[160px]">{l.sellerName || '—'}</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                  <p className="text-[11px] text-[#667085]">{formatMoney(l.originalPrice)} →</p>
                  <p className="font-semibold text-[#101722]">{formatMoney(l.resalePrice)}</p>
                </td>
                <td className="py-3 px-3">
                  <MarkupBar listing={l} />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <Pill tone={listingTone(l.listingStatus)}>{listingStatusLabel(l.listingStatus)}</Pill>
                    {l.isPrivate && <Lock className="h-3.5 w-3.5 text-[#667085]" aria-label="Private listing" />}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </TableShell>

      {page && (
        <Pagination
          page={page.pageNumber}
          totalPages={page.totalPages}
          totalCount={page.totalCount}
          onPage={(next) => update({ page: next })}
        />
      )}

      {selected && (
        <ListingDetailDrawer
          key={selected.listingId}
          listing={selected}
          onClose={() => setSelected(null)}
          onFilterSeller={(sellerId) => {
            setSelected(null);
            update({ sellerId });
          }}
        />
      )}
    </div>
  );
};
