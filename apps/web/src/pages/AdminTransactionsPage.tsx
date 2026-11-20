import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { AdminTransactionDto } from '@ticketshield/api-client';
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
  escrowTone,
  payoutTone,
} from '../components/admin/AdminOpsUi';
import { TransactionDetailDrawer } from '../components/admin/TransactionDetailDrawer';
import { useAdminTransactions } from '../hooks/useAdminTransactions';
import { useNow } from '../hooks/useNow';
import { useUrlFilters } from '../hooks/useUrlFilters';
import {
  formatMoney,
  readTransactionFilters,
  toTransactionParams,
  unlockLabel,
  writeTransactionFilters,
} from '../utils/adminOps';
import { formatEventDateTime } from '../utils/formatters';
import { ESCROW_STATUS_LABEL, PAYOUT_STATUS_LABEL, labelOf } from '../utils/moneyStatus';

const ESCROW_OPTIONS = [
  { value: '', label: 'All escrow statuses' },
  ...Object.entries(ESCROW_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const PAYOUT_OPTIONS = [
  { value: '', label: 'All payouts' },
  ...Object.entries(PAYOUT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const COLUMNS = 8;

/** Giao dịch ký quỹ của toàn sàn (SCRUM-335). Bộ lọc nằm trên URL. */
export const AdminTransactionsPage: React.FC = () => {
  const { filters, update, reset } = useUrlFilters(readTransactionFilters, writeTransactionFilters);
  const params = useMemo(() => toTransactionParams(filters), [filters]);
  const { data, isPending, isError, error, refetch, isFetching } = useAdminTransactions(params);
  const now = useNow(60_000);
  const [selected, setSelected] = useState<AdminTransactionDto | null>(null);

  const summary = data?.summary;
  const page = data?.transactions;
  const rows = page?.items ?? [];
  const failedFirstLoad = isError && !data;
  const hasFilters = !!(
    filters.keyword ||
    filters.status ||
    filters.payoutStatus ||
    filters.holdOnly ||
    filters.from ||
    filters.to
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Escrow Transactions"
        badge={page ? `${page.totalCount} transactions` : undefined}
        onRefresh={() => void refetch()}
        refreshing={isFetching}
      >
        <Link
          to="/admin/config?tab=buffer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E5EAF0] text-[#101722] hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <Clock className="w-3.5 h-3.5 text-[#667085]" />
          <span>Settlement clocks</span>
          <ArrowRight className="w-3 h-3 text-[#667085]" />
        </Link>
      </PageHeader>

      {/* Tính trên đúng các dòng khớp bộ lọc, đủ mọi trang (SCRUM-394). */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <StatCard label="Inflow" value={summary ? formatMoney(summary.totalInflowAmount) : '—'} />
        <StatCard
          label="Held in escrow"
          value={summary ? formatMoney(summary.totalEscrowLockedAmount) : '—'}
          hint={summary ? `${summary.totalLockedCount} transactions on hold` : undefined}
        />
        <StatCard label="Paid out" value={summary ? formatMoney(summary.totalPayoutCompletedAmount) : '—'} />
        <StatCard label="Refunded" value={summary ? formatMoney(summary.totalRefundedAmount) : '—'} />
        <StatCard label="In dispute" value={summary ? summary.totalDisputedCount : '—'} />
      </div>

      <FilterBar>
        <SearchBox
          value={filters.keyword}
          onChange={(keyword) => update({ keyword })}
          placeholder="Ticket, event, buyer, seller, payment or payout ref"
        />
        <FilterSelect
          ariaLabel="Escrow status"
          value={filters.status}
          onChange={(status) => update({ status })}
          options={ESCROW_OPTIONS}
        />
        <FilterSelect
          ariaLabel="Payout status"
          value={filters.payoutStatus}
          onChange={(payoutStatus) => update({ payoutStatus })}
          options={PAYOUT_OPTIONS}
        />
        <FilterToggle checked={filters.holdOnly} onChange={(holdOnly) => update({ holdOnly })} label="Awaiting auto payout" />
        <DateRangeInputs from={filters.from} to={filters.to} onChange={(range) => update(range)} />
        {hasFilters && <ClearFiltersButton onClick={reset} />}
      </FilterBar>

      {isError && data && (
        <ErrorBanner message={errorText(error, 'Could not refresh transactions.')} onRetry={() => void refetch()} busy={isFetching} />
      )}

      <TableShell
        head={
          <tr>
            <th className="py-3 px-3 min-w-[104px]">Created</th>
            <th className="py-3 px-3 min-w-[180px]">Event / Ticket</th>
            <th className="py-3 px-3 min-w-[150px]">Buyer → Seller</th>
            <th className="py-3 px-3 text-right min-w-[100px]">Buyer paid</th>
            <th className="py-3 px-3 text-right min-w-[100px]">Seller gets</th>
            <th className="py-3 px-3 min-w-[96px]">Escrow</th>
            <th className="py-3 px-3 min-w-[110px]">Unlocks</th>
            <th className="py-3 px-3 min-w-[84px]">Payout</th>
          </tr>
        }
      >
        {isPending ? (
          <TableMessage colSpan={COLUMNS} kind="loading" title="Loading transactions..." />
        ) : failedFirstLoad ? (
          <TableMessage
            colSpan={COLUMNS}
            kind="error"
            title="Unable to load transactions"
            detail={errorText(error)}
            action={<RetryButton onClick={() => void refetch()} busy={isFetching} />}
          />
        ) : rows.length === 0 ? (
          <TableMessage
            colSpan={COLUMNS}
            kind="empty"
            title={hasFilters ? 'No transactions match these filters' : 'No transactions yet'}
            action={hasFilters ? <ClearFiltersButton onClick={reset} /> : undefined}
          />
        ) : (
          rows.map((tx) => (
            <tr
              key={tx.escrowId}
              tabIndex={0}
              onClick={() => setSelected(tx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(tx);
                }
              }}
              className="hover:bg-slate-50/70 focus:bg-slate-50 focus:outline-none cursor-pointer"
            >
              <td className="py-3 px-3 font-mono text-[#667085] whitespace-nowrap">{formatEventDateTime(tx.createdAt)}</td>
              <td className="py-3 px-3">
                <p className="font-semibold text-[#101722] truncate max-w-[240px]">{tx.eventName || '—'}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-[#667085] truncate max-w-[170px]" title={tx.newTicketCode || tx.originalTicketCode}>
                    {tx.newTicketCode || tx.originalTicketCode}
                  </span>
                  {tx.bundleId && <Pill tone="slate">COMBO</Pill>}
                </div>
              </td>
              <td className="py-3 px-3 text-[#101722]">
                <span className="truncate">{tx.buyerName || '—'}</span>
                <span className="text-[#667085]"> → </span>
                <span className="truncate">{tx.sellerName || '—'}</span>
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">{formatMoney(tx.totalBuyerPaid)}</td>
              <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">{formatMoney(tx.netSellerPayout)}</td>
              <td className="py-3 px-3">
                <Pill tone={escrowTone(tx.status)}>{labelOf(ESCROW_STATUS_LABEL, tx.status)}</Pill>
              </td>
              <td className="py-3 px-3 font-mono text-[#667085] whitespace-nowrap">{unlockLabel(tx, now)}</td>
              <td className="py-3 px-3">
                {tx.payoutStatus ? (
                  <Pill tone={payoutTone(tx.payoutStatus)}>{labelOf(PAYOUT_STATUS_LABEL, tx.payoutStatus)}</Pill>
                ) : (
                  <span className="text-[#667085]">—</span>
                )}
              </td>
            </tr>
          ))
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
        <TransactionDetailDrawer key={selected.escrowId} tx={selected} now={now} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};
